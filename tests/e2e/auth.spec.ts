import { test, expect } from '@playwright/test';

// ── Auth modal UI tests ───────────────────────────────────────────────────────
// These tests cover modal open/close behaviour and form validation.
// Tests that actually submit credentials are skipped when TEST_USER_EMAIL is not set.

test.describe('Auth modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // ── Open / close ──────────────────────────────────────────────────────────

  test('Login button opens modal in signin mode', async ({ page }) => {
    await page.getByRole('button', { name: /^Login$/ }).click();
    await expect(page.locator('.overlay.open')).toBeVisible();
    await expect(page.locator('.modal h2')).toHaveText('Welcome back');
    await expect(page.locator('.modal-tab.is-on')).toHaveText('Sign in');
  });

  test('Join the Circle nav button opens modal in signup mode', async ({ page }) => {
    await page.locator('header.nav').getByRole('button', { name: 'Join the Circle' }).click();
    await expect(page.locator('.overlay.open')).toBeVisible();
    await expect(page.locator('.modal h2')).toHaveText('Join the Circle');
    await expect(page.locator('.modal-tab.is-on')).toHaveText('Join the Circle');
  });

  test('modal closes on Escape key', async ({ page }) => {
    await page.getByRole('button', { name: /^Login$/ }).click();
    await expect(page.locator('.overlay.open')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.overlay.open')).not.toBeVisible();
  });

  test('modal closes on backdrop click', async ({ page }) => {
    await page.getByRole('button', { name: /^Login$/ }).click();
    await expect(page.locator('.overlay.open')).toBeVisible();
    // Click a corner of the overlay (outside the modal card)
    await page.locator('.overlay.open').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('.overlay.open')).not.toBeVisible();
  });

  test('modal close button dismisses the modal', async ({ page }) => {
    await page.getByRole('button', { name: /^Login$/ }).click();
    await expect(page.locator('.overlay.open')).toBeVisible();
    await page.locator('.modal-close').click();
    await expect(page.locator('.overlay.open')).not.toBeVisible();
  });

  // ── Tab switching ─────────────────────────────────────────────────────────

  test('switching to Join tab shows the name field', async ({ page }) => {
    await page.getByRole('button', { name: /^Login$/ }).click();
    // Name field is absent in signin mode
    await expect(page.locator('#modal-fullName')).not.toBeVisible();
    // Switch to signup
    await page.locator('.modal-tab', { hasText: 'Join the Circle' }).click();
    await expect(page.locator('.modal h2')).toHaveText('Join the Circle');
    await expect(page.locator('#modal-fullName')).toBeVisible();
  });

  test('switching back to Sign in hides the name field', async ({ page }) => {
    await page.locator('header.nav').getByRole('button', { name: 'Join the Circle' }).click();
    await expect(page.locator('#modal-fullName')).toBeVisible();
    await page.locator('.modal-tab', { hasText: 'Sign in' }).click();
    await expect(page.locator('#modal-fullName')).not.toBeVisible();
  });

  // ── Validation / error ────────────────────────────────────────────────────

  test('invalid credentials show an error message', async ({ page }) => {
    await page.getByRole('button', { name: /^Login$/ }).click();
    await page.locator('#modal-email').fill('wrong@example.com');
    await page.locator('#modal-password').fill('wrongpassword');
    await page.locator('.modal .btn-submit').click();
    await expect(page.locator('.auth-error')).toBeVisible();
  });

  // ── Redirect behaviour after login (requires TEST_USER_EMAIL) ─────────────

  test('successful login from home stays on home page', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Requires TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.local');

    await page.getByRole('button', { name: /^Login$/ }).click();
    await page.locator('#modal-email').fill(process.env.TEST_USER_EMAIL!);
    await page.locator('#modal-password').fill(process.env.TEST_USER_PASSWORD!);
    await page.locator('.modal .btn-submit').click();
    await expect(page).toHaveURL('/', { timeout: 20_000 });
  });

  test('successful login from a story page stays on that page', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Requires TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.local');

    const storySlug = 'qu-yuan-and-dragon-boat-festival';
    await page.goto(`/story/${storySlug}`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /^Login$/ }).click();
    await page.locator('#modal-email').fill(process.env.TEST_USER_EMAIL!);
    await page.locator('#modal-password').fill(process.env.TEST_USER_PASSWORD!);
    await page.locator('.modal .btn-submit').click();
    await expect(page).toHaveURL(`/story/${storySlug}`, { timeout: 20_000 });
  });
});

// ── Logged-in nav state (requires TEST_USER_EMAIL) ────────────────────────────
test('nav shows welcome message and Logout button when logged in', async ({ page }) => {
  test.skip(!process.env.TEST_USER_EMAIL, 'Requires TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.local');

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /^Login$/ }).click();
  await page.locator('#modal-email').fill(process.env.TEST_USER_EMAIL!);
  await page.locator('#modal-password').fill(process.env.TEST_USER_PASSWORD!);
  await page.locator('.modal .btn-submit').click();
  await page.locator('.nav-welcome').waitFor({ timeout: 20_000 });

  await expect(page.locator('header.nav').getByRole('button', { name: /Logout/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Login$/ })).not.toBeVisible();
});

// ── Logout (fresh login — does not use saved storageState so signOut cannot
//    invalidate the session used by other storageState-based tests) ────────────
test('logout stays on the current page', async ({ page }) => {
  test.skip(!process.env.TEST_USER_EMAIL, 'Requires TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.local');

  // Log in fresh (own isolated session)
  await page.goto('/library');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /^Login$/ }).click();
  await page.locator('#modal-email').fill(process.env.TEST_USER_EMAIL!);
  await page.locator('#modal-password').fill(process.env.TEST_USER_PASSWORD!);
  await page.locator('.modal .btn-submit').click();
  await page.locator('.nav-welcome').waitFor({ timeout: 20_000 });

  // Now log out and verify we stay on /library
  await page.locator('header.nav').getByRole('button', { name: /Logout/i }).click();
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL('/library');
  await expect(page.getByRole('button', { name: /^Login$/ })).toBeVisible();
});
