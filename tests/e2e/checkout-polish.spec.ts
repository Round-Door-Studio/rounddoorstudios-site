import { test, expect } from '@playwright/test';
import { login } from './helpers';

// ── Canceled-checkout toast ───────────────────────────────────────────────────
// Stripe redirects to /membership?checkout=canceled when the user bails.
// No auth required — the page is public.

test.describe('Membership page — canceled checkout', () => {
  test('shows toast and cleans URL when returning from canceled checkout', async ({ page }) => {
    await page.goto('/membership?checkout=canceled');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.toast')).toBeVisible();
    await expect(page.locator('.toast')).toContainText('canceled');

    // URL is cleaned immediately (no ?checkout param)
    await expect(page).toHaveURL('/membership');
  });

  test('toast auto-dismisses', async ({ page }) => {
    await page.goto('/membership?checkout=canceled');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.toast')).toBeVisible();

    // Default duration is 5 000 ms; allow up to 7 s for the dismiss to fire.
    await expect(page.locator('.toast')).not.toBeVisible({ timeout: 7_000 });
  });

  test('toast can be manually dismissed', async ({ page }) => {
    await page.goto('/membership?checkout=canceled');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.toast')).toBeVisible();

    await page.locator('.toast-close').click();
    await expect(page.locator('.toast')).not.toBeVisible();
  });
});

// ── Account page — checkout success toast ─────────────────────────────────────
// Stripe redirects to /account?checkout=success&type=... after payment.
// Requires a logged-in session.

test.describe('Account page — checkout success toast', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.TEST_USER_EMAIL,
      'Requires TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.local'
    );
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await login(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!);
  });

  test('shows membership toast and cleans URL', async ({ page }) => {
    await page.goto('/account?checkout=success&type=membership');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.toast')).toBeVisible();
    await expect(page.locator('.toast')).toContainText('Circle Membership');

    await expect(page).toHaveURL('/account');
  });

  test('shows story pack toast and cleans URL', async ({ page }) => {
    await page.goto('/account?checkout=success&type=story_pack&slug=frog-at-the-bottom-of-the-well');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.toast')).toBeVisible();
    // Message contains "Payment confirmed" regardless of which story was purchased.
    await expect(page.locator('.toast')).toContainText('Payment confirmed');

    await expect(page).toHaveURL('/account');
  });
});

// ── Membership page — button loading state ────────────────────────────────────
// Intercept the checkout API so it hangs, then verify the button updates.

test('Join the Circle button shows "Redirecting…" while request is pending', async ({ page }) => {
  let resolveRoute!: () => void;
  await page.route('/api/stripe/create-membership-checkout', async (route) => {
    await new Promise<void>((res) => { resolveRoute = res; });
    await route.abort();
  });

  await page.goto('/membership');
  await page.waitForLoadState('networkidle');

  const btn = page.locator('button.btn.btn-primary');
  await expect(btn).toHaveText('Join the Circle');

  await btn.click();

  await expect(btn).toHaveText('Redirecting…');
  await expect(btn).toBeDisabled();

  resolveRoute();
});
