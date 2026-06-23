import { test, expect } from '@playwright/test';
import { openLoginModal, openSignupModal, submitLogin, login } from './helpers';

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
    await openLoginModal(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('.overlay.open')).not.toBeVisible();
  });

  test('modal closes on backdrop click', async ({ page }) => {
    await openLoginModal(page);
    await page.locator('.overlay.open').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('.overlay.open')).not.toBeVisible();
  });

  test('modal close button dismisses the modal', async ({ page }) => {
    await openLoginModal(page);
    await page.locator('.modal-close').click();
    await expect(page.locator('.overlay.open')).not.toBeVisible();
  });

  // ── Tab switching ─────────────────────────────────────────────────────────

  test('switching to Join tab shows the name field', async ({ page }) => {
    await openLoginModal(page);
    await expect(page.locator('#modal-fullName')).not.toBeVisible();
    await page.locator('.modal-tab', { hasText: 'Join the Circle' }).click();
    await expect(page.locator('.modal h2')).toHaveText('Join the Circle');
    await expect(page.locator('#modal-fullName')).toBeVisible();
  });

  test('switching back to Sign in hides the name field', async ({ page }) => {
    await openSignupModal(page);
    await expect(page.locator('#modal-fullName')).toBeVisible();
    await page.locator('.modal-tab', { hasText: 'Sign in' }).click();
    await expect(page.locator('#modal-fullName')).not.toBeVisible();
  });

  // ── Forgot password ───────────────────────────────────────────────────────

  test('forgot password opens on first click without flickering', async ({ page }) => {
    await openLoginModal(page);
    await page.getByRole('button', { name: /Forgot password/i }).click();
    // Modal must remain open and show the reset heading immediately — no double-click needed
    await expect(page.locator('.overlay.open')).toBeVisible();
    await expect(page.locator('.modal h2')).toHaveText('Reset password');
  });

  test('back arrow from forgot password returns to sign in', async ({ page }) => {
    await openLoginModal(page);
    await page.getByRole('button', { name: /Forgot password/i }).click();
    await expect(page.locator('.modal h2')).toHaveText('Reset password');
    await page.getByRole('button', { name: /← Back to sign in/i }).click();
    await expect(page.locator('.modal h2')).toHaveText('Welcome back');
  });

  test('forgot password form shows success message after submitting email', async ({ page }) => {
    await openLoginModal(page);
    await page.getByRole('button', { name: /Forgot password/i }).click();
    await page.locator('#forgot-email').fill('test@rounddoorstudio.com');
    await page.locator('.btn-submit').click();
    await expect(page.locator('.modal-hint')).toContainText('Check your email');
  });

  // ── Validation / error ────────────────────────────────────────────────────

  test('invalid credentials show an error message', async ({ page }) => {
    await openLoginModal(page);
    await submitLogin(page, 'wrong@example.com', 'wrongpassword');
    await expect(page.locator('.auth-error')).toBeVisible();
  });

  // ── Redirect behaviour after login (requires TEST_USER_EMAIL) ─────────────

  test('successful login from home stays on home page', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Requires TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.local');
    await login(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!);
    await expect(page).toHaveURL('/');
  });

  test('successful login from a story page stays on that page', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Requires TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.local');
    const storySlug = 'qu-yuan-and-dragon-boat-festival';
    await page.goto(`/story/${storySlug}`);
    await page.waitForLoadState('networkidle');
    await login(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!);
    await expect(page).toHaveURL(`/story/${storySlug}`);
  });
});

// ── Logged-in nav state (requires TEST_USER_EMAIL) ────────────────────────────
test('nav shows welcome message and Logout button when logged in', async ({ page }) => {
  test.skip(!process.env.TEST_USER_EMAIL, 'Requires TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.local');
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await login(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!);
  await expect(page.locator('header.nav').getByRole('button', { name: /Logout/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Login$/ })).not.toBeVisible();
});

// ── Logout ────────────────────────────────────────────────────────────────────
test('logout stays on the current page', async ({ page }) => {
  test.skip(!process.env.TEST_USER_EMAIL, 'Requires TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.local');
  await page.goto('/library');
  await page.waitForLoadState('networkidle');
  await login(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!);
  await page.locator('header.nav').getByRole('button', { name: /Logout/i }).click();
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL('/library');
  await expect(page.getByRole('button', { name: /^Login$/ })).toBeVisible();
});

// ── Welcome toast ─────────────────────────────────────────────────────────────
test('welcome toast appears after successful login', async ({ page }) => {
  test.skip(!process.env.TEST_USER_EMAIL, 'Requires TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.local');
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await login(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!);
  await expect(page.locator('.toast--welcome')).toBeVisible();
});

// ── Session persistence ───────────────────────────────────────────────────────
test('session persists after page refresh', async ({ page }) => {
  test.skip(!process.env.TEST_USER_EMAIL, 'Requires TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.local');
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await login(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!);
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.nav-welcome')).toBeVisible();
});

test('/library stays accessible after login without being redirected away', async ({ page }) => {
  test.skip(!process.env.TEST_USER_EMAIL, 'Requires TEST_USER_EMAIL / TEST_USER_PASSWORD in .env.local');
  await page.goto('/library');
  await page.waitForLoadState('networkidle');
  await login(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!);
  await expect(page).toHaveURL(/\/library/);
  await expect(page.locator('.nav-welcome')).toBeVisible();
});

// ── Password reset page ───────────────────────────────────────────────────────
test('/auth/reset-password page renders the form', async ({ page }) => {
  await page.goto('/auth/reset-password');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1')).toHaveText('Set a new password');
  await expect(page.locator('input[name="password"]')).toBeVisible();
});
