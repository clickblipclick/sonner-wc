import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.FIXTURE_PORT) || 4173;

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: `bun run test/fixture/serve.ts`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    env: { FIXTURE_PORT: String(PORT) },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], viewport: { width: 1280, height: 900 } },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 900 } },
    },
  ],
});
