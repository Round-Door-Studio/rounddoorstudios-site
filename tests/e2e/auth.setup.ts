/**
 * Playwright global setup — logs in once with TEST_USER_EMAIL / TEST_USER_PASSWORD
 * and saves the session to tests/e2e/.auth/user.json so logged-in tests can reuse it.
 *
 * If the env vars are not set the setup writes an empty state file so the
 * rest of the suite can still run; tests that need auth will skip themselves.
 */

import { chromium, type FullConfig } from '@playwright/test';
import { config as loadEnv } from 'dotenv';
import { mkdirSync, writeFileSync } from 'fs';

const AUTH_FILE = 'tests/e2e/.auth/user.json';
const AUTH_DIR  = 'tests/e2e/.auth';

export default async function globalSetup(config: FullConfig) {
  loadEnv({ path: '.env.local' });

  const email    = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    console.log('[auth setup] TEST_USER_EMAIL / TEST_USER_PASSWORD not set — writing empty session');
    mkdirSync(AUTH_DIR, { recursive: true });
    writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  const baseURL =
  (config.projects[0].use as { baseURL?: string }).baseURL ?? 'http://localhost:3000';

  const browser = await chromium.launch();

  try{
    const context = await browser.newContext();
    const page    = await context.newPage();
  
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
