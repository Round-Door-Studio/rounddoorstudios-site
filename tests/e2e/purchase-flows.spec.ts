import { test, expect } from '@playwright/test';
import { login } from './helpers';

const GATED_SLUG = 'qu-yuan-and-dragon-boat-festival';

// ── Test 1: "Own This Story Pack Forever" opens auth modal when logged out ────
// No auth required — tests the logged-out CTA path.

test('"Own This Story Pack Forever" opens auth modal when logged out', async ({ page }) => {
  await page.goto(`/story/${GATED_SLUG}`);
  await page.waitForLoadState('networkidle');

  const btn = page.locator('button.locked-cta-btn-secondary');
  await expect(btn).toBeVisible();
  await btn.click();

  await expect(page.locator('.overlay.open')).toBeVisible();
  await expect(page.locator('.overlay.open')).toContainText('Sign in to unlock this Story Pack.');

  await page.locator('.modal-close').click();
  await expect(page.locator('.overlay.open')).not.toBeVisible();
});

// ── Test 2: "Own This Story Pack Forever" loading state ───────────────────────
// Requires a FREE account (no subscription) so LockedStoryPack is visible.
// A subscribed user sees the pack as already unlocked — the button doesn't exist.

test('"Own This Story Pack Forever" shows "Redirecting…" while request is pending', async ({ page }) => {
  test.skip(
    !process.env.TEST_USER_FREE_EMAIL,
    'Requires TEST_USER_FREE_EMAIL / TEST_USER_FREE_PASSWORD in .env.local (free account with no subscription)'
  );

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await login(page, process.env.TEST_USER_FREE_EMAIL!, process.env.TEST_USER_FREE_PASSWORD!);

  let resolveRoute!: () => void;
  await page.route('/api/stripe/create-story-pack-checkout', async (route) => {
    await new Promise<void>((res) => { resolveRoute = res; });
    await route.abort();
  });

  await page.goto(`/story/${GATED_SLUG}`);
  await page.waitForLoadState('networkidle');

  const btn = page.locator('button.locked-cta-btn-secondary');
  await expect(btn).toBeVisible();
  await btn.click();

  await expect(btn).toHaveText(/Redirecting…/);
  await expect(btn).toBeDisabled();

  resolveRoute();
});

// ── Test 3: ?autoPurchase=1 auto-triggers story pack checkout ─────────────────
// Requires a FREE account — a subscribed user sees the pack as already unlocked,
// so LockedStoryPack never mounts and the autoPurchase effect never fires.

test('?autoPurchase=1 auto-triggers story pack checkout when logged in', async ({ page }) => {
  test.skip(
    !process.env.TEST_USER_FREE_EMAIL,
    'Requires TEST_USER_FREE_EMAIL / TEST_USER_FREE_PASSWORD in .env.local (free account with no subscription)'
  );

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await login(page, process.env.TEST_USER_FREE_EMAIL!, process.env.TEST_USER_FREE_PASSWORD!);

  let checkoutCalled = false;
  await page.route('/api/stripe/create-story-pack-checkout', async (route) => {
    checkoutCalled = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url: 'https://example.com' }),
    });
  });

  await page.goto(`/story/${GATED_SLUG}?autoPurchase=1`);
  await page.waitForLoadState('networkidle');

  expect(checkoutCalled).toBe(true);
  await expect(page).not.toHaveURL(/autoPurchase/);
});

// ── Test 4: membership interval toggle ───────────────────────────────────────
// No auth required — the toggle is visible to all users.

test.describe('Membership page — interval toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/membership');
    await page.waitForLoadState('networkidle');
  });

  test('defaults to monthly pricing', async ({ page }) => {
    await expect(page.locator('button.btn.btn-primary')).toHaveText('Join the Circle');
    await expect(page.locator('text=$20').first()).toBeVisible();
    await expect(page.locator('text=Billed monthly')).toBeVisible();
  });

  test('switching to Yearly shows yearly pricing and savings badge', async ({ page }) => {
    await page.locator('.interval-btn', { hasText: 'Yearly' }).click();

    await expect(page.locator('text=$18').first()).toBeVisible();
    await expect(page.locator('.interval-savings')).toBeVisible();
    await expect(page.locator('.interval-savings')).toContainText('Save 10%');
    await expect(page.locator('text=$216 billed yearly')).toBeVisible();
  });

  test('switching back to Monthly hides yearly pricing and savings badge', async ({ page }) => {
    await page.locator('.interval-btn', { hasText: 'Yearly' }).click();
    await expect(page.locator('.interval-savings')).toBeVisible();

    await page.locator('.interval-btn', { hasText: 'Monthly' }).click();
    await expect(page.locator('text=$20').first()).toBeVisible();
    await expect(page.locator('.interval-savings')).not.toBeVisible();
  });
});

// ── Test 5: ?autoJoin=monthly auto-triggers membership checkout ───────────────
// Requires a FREE account — a subscribed user would be re-subscribing which
// could behave differently on the server.

test('?autoJoin=monthly auto-triggers membership checkout when logged in', async ({ page }) => {
  test.skip(
    !process.env.TEST_USER_FREE_EMAIL,
    'Requires TEST_USER_FREE_EMAIL / TEST_USER_FREE_PASSWORD in .env.local (free account with no subscription)'
  );

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await login(page, process.env.TEST_USER_FREE_EMAIL!, process.env.TEST_USER_FREE_PASSWORD!);

  let checkoutCalled = false;
  await page.route('/api/stripe/create-membership-checkout', async (route) => {
    checkoutCalled = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url: 'https://example.com' }),
    });
  });

  await page.goto('/membership?autoJoin=monthly');
  await page.waitForLoadState('networkidle');

  expect(checkoutCalled).toBe(true);
  await expect(page).not.toHaveURL(/autoJoin/);
});
