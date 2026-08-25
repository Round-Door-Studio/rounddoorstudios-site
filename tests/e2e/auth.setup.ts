/**
 * Playwright global setup — logs in once with TEST_USER_EMAIL / TEST_USER_PASSWORD
 * and saves the session to tests/e2e/.auth/user.json so logged-in tests can reuse it.
 *
 * If the env vars are not set the setup writes an empty state file so the
 * rest of the suite can still run; tests that need auth will skip themselves.
 *
 * Also warms lib/db/stories.ts / lib/db/content.ts's unstable_cache entries for
 * every released story before any test worker exists (see warmStoryCaches below) —
 * see cache-concurrency-caveat memory for why this step exists.
 */

import { chromium, type FullConfig, type Page } from '@playwright/test';
import { config as loadEnv } from 'dotenv';
import { mkdirSync, writeFileSync } from 'fs';
import { getReleasedStorySlugs } from './helpers';

const AUTH_FILE = 'tests/e2e/.auth/user.json';
const AUTH_DIR  = 'tests/e2e/.auth';

/**
 * Sequentially visits the homepage and every released story's page, single-threaded,
 * before any parallel Playwright worker exists. This pre-populates every
 * unstable_cache entry those pages read (getReleasedStoriesCached,
 * getStoryBySlugCached, getContentCountsCached, ...).
 *
 * Why: on CI's bare `next start` (no Vercel-managed cache backend), many workers
 * hitting the *same cold* cache entry concurrently can hang Next's cache
 * bookkeeping indefinitely — not a real regression, but a known race (see
 * cache-concurrency-caveat memory, and the recurring gating.spec.ts:94 hang on
 * shard 1/3). Warming here single-threaded removes the "cold + concurrent"
 * precondition instead of just papering over the symptom with longer timeouts.
 *
 * This is a best-effort optimization, not a hard requirement — every step below
 * is individually bounded and failures are swallowed. A manually-created context
 * like this one doesn't inherit playwright.config.ts's `use.actionTimeout`, so
 * without explicit timeouts a single stuck request would fall back to
 * Playwright's 30s default and, worse, an uncaught throw here would abort
 * globalSetup entirely — turning "one test flakes" into "zero tests run for
 * this shard". We also skip `waitForLoadState('networkidle')`: `page.goto`'s
 * default 'load' wait already guarantees the SSR response (and therefore the
 * cache population) completed, and trailing image/font requests can keep the
 * network non-idle long after the cache is already warm.
 */
async function warmStoryCaches(page: Page, baseURL: string): Promise<void> {
  const WARMUP_TIMEOUT_MS = 20_000;

  try {
    await page.goto(baseURL, { timeout: WARMUP_TIMEOUT_MS });
  } catch (err) {
    console.warn('[auth setup] Cache warmup: homepage request timed out, skipping story warmup:', (err as Error).message);
    return;
  }

  let slugs: string[] = [];
  try {
    slugs = await getReleasedStorySlugs(page);
  } catch (err) {
    console.warn('[auth setup] Cache warmup: could not list released story slugs, skipping story warmup:', (err as Error).message);
    return;
  }

  let warmed = 0;
  for (const slug of slugs) {
    try {
      await page.goto(`${baseURL}/story/${slug}`, { timeout: WARMUP_TIMEOUT_MS });
      warmed++;
    } catch (err) {
      console.warn(`[auth setup] Cache warmup: /story/${slug} timed out, skipping:`, (err as Error).message);
    }
  }
  console.log(`[auth setup] Warmed story cache for ${warmed}/${slugs.length} released stories`);
}

export default async function globalSetup(config: FullConfig) {
  loadEnv({ path: '.env.local' });

  const baseURL =
  (config.projects[0].use as { baseURL?: string }).baseURL ?? 'http://localhost:3000';

  const browser = await chromium.launch();
  const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

  try {
    const warmupContext = await browser.newContext({
      baseURL,
      ...(bypassSecret ? {
        extraHTTPHeaders: { 'x-vercel-protection-bypass': bypassSecret },
      } : {}),
    });
    try {
      await warmStoryCaches(await warmupContext.newPage(), baseURL);
    } catch (err) {
      // Belt-and-suspenders: warmStoryCaches already catches its own steps, but
      // this must never be allowed to abort globalSetup regardless.
      console.warn('[auth setup] Cache warmup pass failed, continuing without it:', (err as Error).message);
    }
    await warmupContext.close();

    const email    = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
      console.log('[auth setup] TEST_USER_EMAIL / TEST_USER_PASSWORD not set — writing empty session');
      mkdirSync(AUTH_DIR, { recursive: true });
      writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));
      return;
    }

    const context = await browser.newContext({
      ...(bypassSecret ? {
        extraHTTPHeaders: { 'x-vercel-protection-bypass': bypassSecret },
      } : {}),
    });
    const page = await context.newPage();

    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    // Open signin modal via the Login button in the nav
    await page.getByRole('button', { name: /^Login$/ }).click();
    await page.locator('.overlay.open').waitFor();

    // Fill in credentials
    await page.locator('#modal-email').fill(email);
    await page.locator('#modal-password').fill(password);
    await page.locator('.modal .btn-submit').click();

    // Wait for the server action to complete — the nav-welcome span only appears once
    // the session cookie is set and the page has re-rendered as a logged-in user.
    await page.locator('.nav-welcome').waitFor({ timeout: 20_000 });

    mkdirSync(AUTH_DIR, { recursive: true });
    await context.storageState({ path: AUTH_FILE });
    console.log('[auth setup] Session saved →', AUTH_FILE);
  } finally {
    await browser.close();
  }
}
