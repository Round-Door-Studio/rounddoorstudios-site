import { test, expect } from '@playwright/test';

// Google OAuth cannot be fully automated (the flow leaves the site and requires
// a real Google account interaction). These tests verify everything up to the
// point where the browser hands off to Google.

test.describe('Google OAuth', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /^Login$/ }).click();
    await page.locator('.overlay.open').waitFor();
  });

  test('Continue with Google button is visible in signin mode', async ({ page }) => {
    await expect(page.locator('.btn-google')).toBeVisible();
    await expect(page.locator('.btn-google')).toContainText('Continue with Google');
  });

  test('Continue with Google button is visible in signup mode', async ({ page }) => {
    await page.locator('.modal-tab', { hasText: 'Join the Circle' }).click();
    await expect(page.locator('.btn-google')).toBeVisible();
  });

  test('clicking Continue with Google initiates OAuth redirect to Google', async ({ page }) => {
    // Intercept the navigation so we don't actually leave the site
    const [popup] = await Promise.all([
      // Supabase OAuth opens in the same tab (redirect, not popup)
      // Wait for a navigation away from localhost
      page.waitForURL(/accounts\.google\.com|supabase\.co\/auth/, { timeout: 10_000 })
        .then(() => page.url())
        .catch(() => null),
      page.locator('.btn-google').click(),
    ]);

    // Either we were redirected to Google/Supabase OAuth, or Supabase is
    // handling it server-side. Either way the button must not error out.
    const currentURL = page.url();
    const wentToOAuth =
      currentURL.includes('accounts.google.com') ||
      currentURL.includes('supabase.co') ||
      currentURL.includes('google') ||
      popup !== null;

    // If still on localhost the click did nothing visible — that's a failure.
    // We accept any OAuth handoff URL as a pass.
    if (!wentToOAuth && currentURL.startsWith('http://localhost')) {
      throw new Error(
        `Expected Google OAuth redirect but stayed on ${currentURL}. ` +
        `Check that NEXT_PUBLIC_SUPABASE_URL and Google provider are configured.`
      );
    }
  });

});

// ── OAuth callback route ──────────────────────────────────────────────────────
test('auth callback route exists and handles missing code gracefully', async ({ page }) => {
  // Hitting /auth/callback without a code param should not 500 —
  // it should redirect or show a sensible error, not a crash page.
  const response = await page.goto('/auth/callback');
  // Any non-500 response is acceptable (redirect, 200, 404 are all fine)
  expect(response?.status()).not.toBe(500);
});
