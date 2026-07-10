import { test, expect } from '@playwright/test';
import { login } from './helpers';

// ── Subscriber account tests (TEST_USER_EMAIL) ────────────────────────────────
// Tests that require an active or canceling subscription.

test.describe('Account page — subscriber', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_USER_EMAIL,
      'Requires TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.local'
    );
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await login(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!);
  });

  test('account page renders greeting and email', async ({ page }) => {
    await page.goto('/account');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.acct-head h1')).toBeVisible();
    await expect(page.locator('.acct-email')).toContainText(process.env.TEST_USER_EMAIL!);
    await expect(page.locator('.acct-section-title').first()).toBeVisible();
  });

  test('"Manage Membership" button shows "Opening portal…" while request is pending', async ({ page }) => {
    await page.goto('/account');
    await page.waitForLoadState('networkidle');

    const manageBtn = page.locator('button.btn.btn-ghost', { hasText: 'Manage Membership' });
    await expect(manageBtn).toBeVisible();

    // Set up intercept after page load so it doesn't interfere with initial requests
    let resolveRoute!: () => void;
    await page.route('/api/stripe/create-portal-session', async (route) => {
      await new Promise<void>((res) => { resolveRoute = res; });
      await route.abort();
    });

    await manageBtn.click();

    // Locator with hasText filter no longer matches after text changes —
    // use a new locator scoped to the updated text
    const loadingBtn = page.locator('button.btn.btn-ghost', { hasText: 'Opening portal…' });
    await expect(loadingBtn).toBeVisible();
    await expect(loadingBtn).toBeDisabled();

    resolveRoute();
  });

  test('logout from /account navigates to home page', async ({ page }) => {
    await page.goto('/account');
    await page.waitForLoadState('networkidle');

    // Use the bottom logout button (server action form in AccountClient)
    const logoutBtn = page.locator('.acct-logout button[type="submit"]');
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('/');
    await expect(page.locator('.nav-welcome')).not.toBeVisible();
  });
});

// ── Free account tests (TEST_USER_FREE_EMAIL) ─────────────────────────────────
// Tests that require a free account with no subscription and no purchases.

test.describe('Account page — free user', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_USER_FREE_EMAIL,
      'Requires TEST_USER_FREE_EMAIL / TEST_USER_FREE_PASSWORD in .env.local (free account, no subscription)'
    );
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await login(page, process.env.TEST_USER_FREE_EMAIL!, process.env.TEST_USER_FREE_PASSWORD!);
  });

  test('shows empty state when no individual story packs purchased', async ({ page }) => {
    await page.goto('/account');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.pack-empty-copy')).toBeVisible();
    await expect(page.locator('.pack-empty-copy')).toContainText('No individual Story Packs');
  });
});

// ── Purchaser account tests (TEST_USER_PURCHASER_EMAIL) ───────────────────────
// Tests that require an account with at least one individually purchased story pack
// and no subscription (so packs show with "Yours to keep" badge, not via membership).

test.describe('Account page — individual purchaser', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_USER_PURCHASER_EMAIL,
      'Requires TEST_USER_PURCHASER_EMAIL / TEST_USER_PURCHASER_PASSWORD in .env.local (account with story pack purchase, no subscription)'
    );
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await login(page, process.env.TEST_USER_PURCHASER_EMAIL!, process.env.TEST_USER_PURCHASER_PASSWORD!);
  });

  test('purchased story pack shows "Yours to keep" badge', async ({ page }) => {
    await page.goto('/account');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.pack-list')).toBeVisible();
    await expect(page.locator('.pack-yours-badge').first()).toBeVisible();
    await expect(page.locator('.pack-yours-badge').first()).toContainText('Yours to keep');
  });
});
