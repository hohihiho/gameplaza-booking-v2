import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.BASE_URL || 'http://localhost:3000'
const isExternal = baseURL && !baseURL.includes('localhost')

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    testIdAttribute: 'data-testid',
    timeout: 30000,
    actionTimeout: 10000,
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Only run the error scan spec
  testMatch: ['specs/error-scan.spec.ts'],
  webServer: isExternal
    ? undefined
    : {
        command: 'NODE_ENV=test npm run dev:no-browser',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        env: {
          NODE_ENV: 'test',
          NEXT_PUBLIC_TEST_MODE: 'true',
        },
      },
})

