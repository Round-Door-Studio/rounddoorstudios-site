import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('renders the hero section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Mandarin and English stories/i })).toBeVisible();
  });

  test('featured story section is visible', async ({ page }) => {
    await expect(page.locator('#featured')).toBeVisible();
  });

  test('navigation links to library and about exist in the DOM', async ({ page }) => {
    // Nav links are hidden via CSS on narrow viewports (< 880px) by design.
    // We verify they exist in the nav so a future mobile nav can surface them.
    await expect(page.locator('nav.nav-links a[href="/library"]')).toBeAttached();
    await expect(page.locator('nav.nav-links a[href="/about"]')).toBeAttached();
  });

  test('opening the waitlist modal and closing it', async ({ page }) => {
    await page.getByRole('button', { name: /Don't Miss the Next Story/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('script toggle switches to traditional', async ({ page }) => {
    const tradBtn = page.getByRole('button', { name: /Traditional/i });
    await tradBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-script', 'trad');
  });

  // ── Script toggle content visibility ─────────────────────────────────────────
  test('simplified is the default — simp content visible, trad content hidden', async ({ page }) => {
    await expect(page.locator('.featured-zh .only-simp')).toBeVisible();
    await expect(page.locator('.featured-zh .only-trad')).not.toBeVisible();
  });

  test('switching to Traditional shows trad content and hides simp content', async ({ page }) => {
    await page.getByRole('button', { name: /Traditional/i }).click();
    await expect(page.locator('.featured-zh .only-trad')).toBeVisible();
    await expect(page.locator('.featured-zh .only-simp')).not.toBeVisible();
  });

  test('switching back to Simplified restores simp content', async ({ page }) => {
    await page.getByRole('button', { name: /Traditional/i }).click();
    await page.getByRole('button', { name: /Simplified/i }).click();
    await expect(page.locator('.featured-zh .only-simp')).toBeVisible();
    await expect(page.locator('.featured-zh .only-trad')).not.toBeVisible();
  });

  test('clicking Browse Stories navigates to library', async ({ page }) => {
    await page.getByRole('link', { name: 'Browse Stories' }).click();
    await expect(page).toHaveURL('/library');
  });
});
