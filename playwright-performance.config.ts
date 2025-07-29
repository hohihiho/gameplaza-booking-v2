import { defineConfig, devices } from '@playwright/test';

/**
 * 성능 테스트 전용 Playwright 설정
 * Rate limiting 문제를 완전히 방지하는 설정
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/*performance*.spec.{ts,js}', '**/*load*.spec.{ts,js}'],
  /* 성능 테스트는 순차 실행 필수 */
  fullyParallel: false,
  /* 실패 시 재시도 비활성화 (성능 측정 정확성) */
  retries: 0,
  /* 단일 워커만 사용 */
  workers: 1,
  /* 상세한 리포트 */
  reporter: [
    ['html', { outputFolder: 'playwright-performance-report' }],
    ['json', { outputFile: 'playwright-performance-results.json' }]
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    
    /* 성능 테스트용 헤더 */
    extraHTTPHeaders: {
      'X-Test-Environment': 'true',
      'X-Performance-Test': 'true',
    },
    
    /* 타임아웃 증가 */
    timeout: 60000,
    actionTimeout: 20000,
    navigationTimeout: 30000,
  },

  /* 성능 테스트는 Chrome만 사용 */
  projects: [
    {
      name: 'performance-chrome',
      use: { 
        ...devices['Desktop Chrome'],
        headless: true,
        /* 성능 측정을 위한 느린 실행 */
        slowMo: 3000,
      },
    },
  ],

  webServer: {
    command: 'NODE_ENV=test npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      NODE_ENV: 'test',
      NEXT_PUBLIC_TEST_MODE: 'true',
      NEXT_PUBLIC_PERFORMANCE_TEST: 'true',
    },
  },
});