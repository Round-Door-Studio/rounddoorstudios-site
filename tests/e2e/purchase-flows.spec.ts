import { test, expect } from '@playwright/test';
import { login } from './helpers';

const GATED_SLUG = 'qu-yuan-and-dragon-boat-festival';

// ── Test 1: "Own This Story Pack Forever" opens auth modal when logged out ────

test('"Own This Story Pack Forever" opens auth modal when logged out', async ({ page }) => {
  await page.goto(`/story/${GATED_SLUG}`);
  await page.waitForLoadState('networkidle');

  const btn = page.locator('button.locked-cta-btn-secondary');
  await expect(btn).toBeVisible();
  await btn.click();

  await expect(page.locator('.overlay.open')).toBeVisible();
  await expect(page.locator('.overlay.open')).toContainText('Sign in to unlock this Story Pack.');

  // Close the modal
  await page.locator('.modal-close').click();
  await expect(page.locator('.overlay.open')).not.toBeVisible();
});

// ── Test 2: "Own This Story Pack Forever" loading state (logged in, intercepted) ──

test('"Own This Story Pack Forever" shows "Redirecting…" while request is pending', async ({ page }) => {
  test.skip(
    !process.env.TEST_USER_EMAIL,
    'Requires TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.local'
  );

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await login(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!);

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

// ── Test 3: ?autoPurchase=1 auto-triggers story pack checkout (logged in) ─────

test('?autoPurchase=1 auto-triggers story pack checkout when logged in', async ({ page }) => {
  test.skip(
    !process.env.TEST_USER_EMAIL,
    'Requires TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.local'
  );

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await login(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!);

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

test.describe('Membership page — interval toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/membership');
    await page.waitForLoadState('networkidle');
  });

  test('defaults to monthly pricing', async ({ page }) => {
    await expect(page.locator('button.btn.btn-primary')).toHaveText('Join the Circle');
    // Monthly price displayed
    await expect(page.locator('text=$20').first()).toBeVisible();
    // Billing note
    await expect(page.locator('text=Billed monthly')).toBeVisible();
  });

  test('switching to Yearly shows yearly pricing and savings badge', async ({ page }) => {
    // Click the Yearly interval button
    await page.locator('.interval-btn', { hasText: 'Yearly' }).click();

    // Price changes to $18/mo equivalent
    await expect(page.locator('text=$18').first()).toBeVisible();
    // Savings badge appears
    await expect(page.locator('.interval-savings')).toBeVisible();
    await expect(page.locator('.interval-savings')).toContainText('Save 10%');
    // Billing note shows yearly total
    await expect(page.locator('text=$216 billed yearly')).toBeVisible();
  });

  test('switching back to Monthly hides yearly pricing and savings badge', async ({ page }) => {
    // Switch to yearly first
    await page.locator('.interval-btn', { hasText: 'Yearly' }).click();
    await expect(page.locator('.interval-savings')).toBeVisible();

    // Switch back to monthly
    await page.locator('.interval-btn', { hasText: 'Monthly' }).click();
    await expect(page.locator('text=$20').first()).toBeVisible();
    await expect(page.locator('.interval-savings')).not.toBeVisible();
  });
});

// ── Test 5: ?autoJoin=monthly auto-triggers membership checkout (logged in) ──

test('?autoJoin=monthly auto-triggers membership checkout when logged in', async ({ page }) => {
  test.skip(
    !process.env.TEST_USER_EMAIL,
    'Requires TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.local'
  );

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await login(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!);

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
