import { defineConfig, devices } from '@playwright/test';

/**
 * E2E tests run against the full stack:
 *  - Vite dev server on http://localhost:5173 (started automatically)
 *  - Express backend expected on http://localhost:3000  (start with: npm run dev in root)
 *
 * In CI, the backend is started via the ci.yml "e2e" job before launching Playwright.
 *
 * Browser binaries: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers (pre-installed in this env)
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 30_000,

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
