import type { Page } from '@playwright/test';

// ── Auth helpers ──────────────────────────────────────────────────────────────

/** Opens the login modal and waits for it to be ready to interact with. */
export async function openLoginModal(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^Login$/ }).click();
  await page.locator('.overlay.open').waitFor();
}

/** Opens the signup modal via the nav Join the Circle button and waits for it. */
export async function openSignupModal(page: Page): Promise<void> {
  await page.locator('header.nav').getByRole('button', { name: 'Join the Circle' }).click();
  await page.locator('.overlay.open').waitFor();
}

/** Fills and submits the login form. Call openLoginModal first. */
export async function submitLogin(page: Page, email: string, password: string): Promise<void> {
  await page.locator('#modal-email').fill(email);
  await page.locator('#modal-password').fill(password);
  await page.locator('.modal .btn-submit').click();
}

/**
 * Full login flow: opens modal, fills credentials, submits, and waits until
 * the nav-welcome element appears (confirming the session is active).
 */
export async function login(page: Page, email: string, password: string): Promise<void> {
  await openLoginModal(page);
  await submitLogin(page, email, password);
  await page.locator('.nav-welcome').waitFor({ timeout: 20_000 });
}

// ── Library slug helpers ──────────────────────────────────────────────────────

/** Navigates to /library and returns all released story slugs in display order. */
export async function getReleasedStorySlugs(page: Page): Promise<string[]> {
  await page.goto('/library');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Grid/i }).click();
  return page.locator('.story-card:not(.is-soon)').evaluateAll(
    (cards) => cards.map((c) => c.getAttribute('data-slug')).filter(Boolean) as string[]
  );
}

/** Navigates to /library and returns all story slugs in display order (including upcoming). */
export async function getAllStorySlugs(page: Page): Promise<string[]> {
  await page.goto('/library');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Grid/i }).click();
  return page.locator('.story-card').evaluateAll(
    (cards) => cards.map((c) => c.getAttribute('data-slug')).filter(Boolean) as string[]
  );
}
