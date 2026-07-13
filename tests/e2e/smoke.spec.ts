import { test, expect } from '@playwright/test';

// ── Smoke tests — verify key pages render without errors ──────────────────────
// These tests do not require auth and cover pages added with the payments feature.

test('/about page renders', async ({ page }) => {
  await page.goto('/about');
  await page.waitForLoadState('networkidle');

  // Main heading should be present — absence or a 500 error would hide it
  await expect(page.locator('h1')).toBeVisible();
});

test('/terms page renders with refund policy section', async ({ page }) => {
  await page.goto('/terms');
  await page.waitForLoadState('networkidle');

  await expect(page.locator('h1')).toBeVisible();
  // The refund policy section has id="refund-policy" (linked from membership page)
  await expect(page.locator('#refund-policy')).toBeVisible();
  await expect(page.locator('#refund-policy')).toContainText('Refund');
});

test('/privacy page renders', async ({ page }) => {
  await page.goto('/privacy');
  await page.waitForLoadState('networkidle');

  await expect(page.locator('h1')).toBeVisible();
});
