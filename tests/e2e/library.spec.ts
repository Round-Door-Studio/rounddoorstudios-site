import { test, expect } from '@playwright/test';

test.describe('Library', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/library');
  });

  test('renders the library heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Open the book/i })).toBeVisible();
  });

  test('book view is the default', async ({ page }) => {
    const bookBtn = page.getByRole('button', { name: /Book/i });
    await expect(bookBtn).toHaveClass(/is-on/);
    await expect(page.locator('.book')).toBeVisible();
  });

  test('switching to grid view shows story cards', async ({ page }) => {
    await page.getByRole('button', { name: /Grid/i }).click();
    await expect(page.locator('.grid')).toBeVisible();
    await expect(page.locator('.story-card').first()).toBeVisible();
  });

  test('clicking a released story navigates to the story page', async ({ page }) => {
    // Switch to grid to find released story easily
    await page.getByRole('button', { name: /Grid/i }).click();
    await page.locator('.story-card:not(.is-soon)').first().getByRole('link').first().click();
    await expect(page).toHaveURL(/\/story\//);
  });

  test('unreleased stories show "Coming soon"', async ({ page }) => {
    await page.getByRole('button', { name: /Grid/i }).click();
    const soonCards = page.locator('.story-card.is-soon');
    await expect(soonCards.first()).toBeVisible();
    await expect(soonCards.first()).toContainText('Coming soon');
  });

  test('library CTA is present at the bottom', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /A New Story is Always On Its Way/i })).toBeVisible();
  });
});
