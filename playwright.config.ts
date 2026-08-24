import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from 'dotenv';

// Load TEST_USER_EMAIL / TEST_USER_PASSWORD from .env.local so auth.setup.ts
// and any test.skip(!) guards can read them without a separate env step.
loadEnv({ path: '.env.local' });

// Set PLAYWRIGHT_BASE_URL to run against a remote target (e.g. a Vercel preview URL)
// instead of spinning up a local dev server.
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const isLocal  = BASE_URL.includes('localhost') || BASE_URL.includes('127.0.0.1');

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/auth.setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 4 : 4,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? { 'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET }
      : {},
  },
  projects: process.env.CI
    ? [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'Mobile Safari', use: { ...devices['iPhone 14'] } },
      ]
    : [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
      ],
  ...(isLocal ? {
    webServer: {
      command: process.env.CI ? 'npm start' : 'npm run dev',
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  } : {}),
});
