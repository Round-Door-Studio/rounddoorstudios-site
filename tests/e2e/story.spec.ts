import { test, expect } from '@playwright/test';

// ep 1 — always the first released story; safe to hardcode
const RELEASED_SLUG = 'frog-at-the-bottom-of-the-well';

test.describe('Story page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/story/${RELEASED_SLUG}`);
    await page.waitForLoadState('networkidle');
  });

  test('renders story title', async ({ page }) => {
    await expect(page.locator('.read-hero h1')).toBeVisible();
  });

  test('renders the story pack tabs', async ({ page }) => {
    await expect(page.locator('.pack-cards')).toBeVisible();
    await expect(page.getByRole('tab', { name: /Read Along/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /New Words/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Curious Questions/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Culture Corner/i })).toBeVisible();
  });

  test('read along panel is active by default', async ({ page }) => {
    const panel = page.locator('#pack-panel-read');
    await expect(panel).toBeVisible();
  });

  test('switching to New Words tab shows vocab', async ({ page }) => {
    await page.getByRole('tab', { name: /New Words/i }).click();
    await expect(page.locator('#pack-panel-words')).toBeVisible();
    await expect(page.locator('.pack-vocab-card').first()).toBeVisible();
  });

  test('switching to Curious Questions tab shows questions', async ({ page }) => {
    await page.getByRole('tab', { name: /Curious Questions/i }).click();
    await expect(page.locator('#pack-panel-questions')).toBeVisible();
    await expect(page.locator('.pack-q-card').first()).toBeVisible();
  });

  test('switching to Culture Corner tab shows activities', async ({ page }) => {
    await page.getByRole('tab', { name: /Culture Corner/i }).click();
    await expect(page.locator('#pack-panel-explore')).toBeVisible();
  });

  test('reading mode toggle switches between simp and trad', async ({ page }) => {
    const tradBtn = page.getByRole('tab', { name: /繁 Traditional/i });
    await tradBtn.click();
    await expect(page.locator('#reading')).toHaveClass(/mode-trad/);
  });

  test('compare mode shows side-by-side layout', async ({ page }) => {
    await page.getByRole('tab', { name: /Compare/i }).click();
    await expect(page.locator('#reading')).toHaveClass(/mode-compare/);
  });

  test('back link returns to library', async ({ page }) => {
    await page.getByRole('link', { name: /Back to the library/i }).click();
    await expect(page).toHaveURL('/library');
  });

  test('listen control switches between English and Chinese', async ({ page }) => {
    const zhBtn = page.locator('.listen-control--detail').getByRole('tab', { name: '中文' });
    await zhBtn.click();
    await expect(page.locator('.listen-control--detail')).toHaveAttribute('data-active-lang', 'zh');
  });
});

test('unreleased story shows "door not opened" message', async ({ page }) => {
  // Discover an unreleased slug from the library grid rather than hardcoding one
  await page.goto('/library');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Grid/i }).click();
  const slug = await page.locator('.story-card.is-soon').first().getAttribute('data-slug');
  await page.goto(`/story/${slug}`);
  await expect(page.getByText(/hasn't opened yet/i)).toBeVisible();
});
