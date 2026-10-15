import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: process.env.PREVIEW_URL || 'http://127.0.0.1:4300',
    browserName: 'chromium',
    channel: 'chromium',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
  },
  reporter: 'list',
  webServer: process.env.PREVIEW_URL
    ? undefined
    : {
        command: 'pnpm run dev',
        url: 'http://127.0.0.1:4300',
        reuseExistingServer: !process.env.CI,
        timeout: 30000,
      },
});
