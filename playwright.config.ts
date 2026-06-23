import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from 'dotenv';

// Load TEST_USER_EMAIL / TEST_USER_PASSWORD from .env.local so auth.setup.ts
// and any test.skip(!) guards can read them without a separate env step.
loadEnv({ path: '.env.local' });

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/auth.setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    actionTimeout: 15_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
