import { defineConfig, devices } from '@playwright/test';

/**
 * Cấu hình kiểm thử tự động Playwright E2E cho Quỹ Tín Dụng Nhân Dân Yên Thọ - HRM
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  timeout: 45000,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
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
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
