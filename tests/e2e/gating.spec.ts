import { test, expect } from '@playwright/test';

// Story 1 is always free; story 2 is released but gated for logged-out users.
const FREE_SLUG   = 'frog-at-the-bottom-of-the-well';
const GATED_SLUG  = 'qu-yuan-and-dragon-boat-festival';

// ── Logged-out gating ─────────────────────────────────────────────────────────
test.describe('Logged-out story gating', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/story/${GATED_SLUG}`);
    await page.waitForLoadState('networkidle');
  });

  test('gated story shows locked cards, not the story pack', async ({ page }) => {
    await expect(page.locator('.locked-cards')).toBeVisible();
    await expect(page.locator('.pack-cards')).not.toBeVisible();
  });

  test('locked section shows exactly 4 locked cards', async ({ page }) => {
    await expect(page.locator('.locked-card')).toHaveCount(4);
  });

  test('each locked card has a lock badge', async ({ page }) => {
    const badges = page.locator('.locked-card .locked-badge');
    await expect(badges).toHaveCount(4);
    for (const badge of await badges.all()) {
      await expect(badge).toBeVisible();
    }
  });

  test('locked section shows members pill', async ({ page }) => {
    await expect(page.locator('.locked-members-pill')).toBeVisible();
  });

  test('locked section shows CTA heading', async ({ page }) => {
    await expect(page.locator('.locked-cta-heading')).toBeVisible();
  });

  test('locked CTA button opens auth modal in signup mode', async ({ page }) => {
    await page.locator('.locked-cta-btn').click();
    await expect(page.locator('.overlay.open')).toBeVisible();
    await expect(page.locator('.modal h2')).toHaveText('Join the Circle');
    await expect(page.locator('.modal-tab.is-on')).toHaveText('Join the Circle');
  });

  test('"Explore a Sample Story Pack" link goes to story 1', async ({ page }) => {
    const link = page.locator('.locked-try-free');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', `/story/${FREE_SLUG}`);
  });

  test('locked desc counts are not all zeros', async ({ page }) => {
    const descs = page.locator('.locked-desc');
    // Sanity check that the DB content was seeded correctly.
    const texts = await descs.allTextContents();
    expect(texts.length, 'No .locked-desc elements found — check LockedStoryPack renders them').toBeGreaterThan(0);
    const hasNonZero = texts.some((t) => !/^0 /.test(t.trim()));
    expect(hasNonZero, `All counts were zero: ${texts.join(', ')}`).toBe(true);
  });
});

// ── Story 1 is always free ────────────────────────────────────────────────────
test.describe('Story 1 is free for everyone', () => {
  test('story 1 shows the full story pack, not locked cards', async ({ page }) => {
    await page.goto(`/story/${FREE_SLUG}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.pack-cards')).toBeVisible();
    await expect(page.locator('.locked-cards')).not.toBeVisible();
    await expect(page.locator('.locked-cta')).not.toBeAttached();
  });
});

// ── Logged-in users can access gated stories (requires TEST_USER_EMAIL) ───────
// These tests do an inline login so each owns an isolated session and doesn't
// share state with parallel tests.
test.describe('Logged-in story access', () => {
  async function loginOnStoryPage(page: import('@playwright/test').Page) {
    await page.goto(`/story/${GATED_SLUG}`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /^Login$/ }).click();
    await page.locator('.overlay.open').waitFor();
    await page.locator('#modal-email').fill(process.env.TEST_USER_EMAIL!);
    await page.locator('#modal-password').fill(process.env.TEST_USER_PASSWORD!);
    await page.locator('.modal .btn-submit').click();
    // Server action redirects back to the same story page after login
    await page.waitForLoadState('networkidle');
  }

  test('logged-in user sees full story pack on gated story', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Requires TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.local');

    await loginOnStoryPage(page);

    await expect(page.locator('.pack-cards')).toBeVisible();
    await expect(page.locator('.locked-cards')).not.toBeVisible();
  });

  test('logged-in user sees welcome message in nav on gated story page', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Requires TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.local');

    await loginOnStoryPage(page);

    await expect(page.locator('.nav-welcome')).toBeVisible();
  });
});

// ── Gating across all released stories (dynamic) ─────────────────────────────
test('every released story (except story 1) shows locked cards when logged out', async ({ page }) => {
  await page.goto('/library');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Grid/i }).click();

  const slugs = await page.locator('.story-card:not(.is-soon)').evaluateAll(
    (cards) => cards.map((c) => c.getAttribute('data-slug')).filter(Boolean)
  ) as string[];

  // Skip story 1 (free); all others must be gated for anonymous visitors
  const gatedSlugs = slugs.filter((s) => s !== FREE_SLUG);
  expect(gatedSlugs.length).toBeGreaterThan(0);

  for (const slug of gatedSlugs) {
    await page.goto(`/story/${slug}`);
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('.locked-cards'),
      `Expected .locked-cards on /story/${slug}`
    ).toBeVisible();
    await expect(
      page.locator('.pack-cards'),
      `Expected .pack-cards to be hidden on /story/${slug}`
    ).not.toBeVisible();
  }
});
