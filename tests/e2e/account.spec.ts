import { test, expect } from '@playwright/test';
import { login } from './helpers';

// All tests in this file require a logged-in session.
test.beforeEach(async ({ page }) => {
  test.skip(
    !process.env.TEST_USER_EMAIL,
    'Requires TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.local'
  );
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await login(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!);
});

// ── Test 1: account page renders for logged-in user ──────────────────────────

test('account page renders greeting and email for logged-in user', async ({ page }) => {
  await page.goto('/account');
  await page.waitForLoadState('networkidle');

  await expect(page.locator('.acct-head h1')).toBeVisible();
  await expect(page.locator('.acct-email')).toContainText(process.env.TEST_USER_EMAIL!);
  await expect(page.locator('.acct-section-title').first()).toBeVisible();
});

// ── Test 2: empty state when no story packs purchased ────────────────────────

test('shows empty state copy when no individual story packs purchased', async ({ page }) => {
  await page.goto('/account');
  await page.waitForLoadState('networkidle');

  const emptyState = page.locator('.pack-empty-copy');
  const hasPacks = await page.locator('.pack-list').isVisible();

  if (hasPacks) {
    // User has purchased packs — this test is only meaningful for a no-purchase user
    test.skip(true, 'Test user has purchased story packs — skipping empty state check');
    return;
  }

  await expect(emptyState).toBeVisible();
  await expect(emptyState).toContainText('No individual Story Packs');
});

// ── Test 3: "Manage Membership" button loading state (if member) ─────────────

test('"Manage Membership" button shows "Opening portal…" while request is pending', async ({ page }) => {
  await page.goto('/account');
  await page.waitForLoadState('networkidle');

  const manageBtn = page.locator('button.btn.btn-ghost', { hasText: 'Manage Membership' });
  const isMember = await manageBtn.isVisible();

  if (!isMember) {
    test.skip(true, 'Test user is not a member — "Manage Membership" button not present');
    return;
  }

  let resolveRoute!: () => void;
  await page.route('/api/stripe/create-portal-session', async (route) => {
    await new Promise<void>((res) => { resolveRoute = res; });
    await route.abort();
  });

  await manageBtn.click();

  await expect(manageBtn).toHaveText('Opening portal…');
  await expect(manageBtn).toBeDisabled();

  resolveRoute();
});

// ── Test 4: logout from /account goes to home page ───────────────────────────

test('logout from /account navigates to home page', async ({ page }) => {
  await page.goto('/account');
  await page.waitForLoadState('networkidle');

  // The logout form is in the .acct-logout section (server action)
  const logoutBtn = page.locator('.acct-logout button[type="submit"]');
  await expect(logoutBtn).toBeVisible();
  await logoutBtn.click();

  await page.waitForLoadState('networkidle');

  await expect(page).toHaveURL('/');
  await expect(page.locator('.nav-welcome')).not.toBeVisible();
});
