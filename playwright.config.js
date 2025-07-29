const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/screenshots',
  
  // 테스트 실행 설정
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  
  // 실패 시 재시도
  retries: process.env.CI ? 2 : 0,
  
  // 병렬 실행 워커 수
  workers: process.env.CI ? 1 : 2,
  
  // 리포터 설정
  reporter: [
    ['html', { outputFolder: 'tests/reports' }],
    ['list'],
    ['json', { outputFile: 'tests/reports/results.json' }]
  ],
  
  use: {
    // 기본 URL
    baseURL: 'http://localhost:3000',
    
    // 스크린샷 및 비디오 설정
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // 브라우저 컨텍스트 설정
    ignoreHTTPSErrors: true,
    
    // 네트워크 설정
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    // 모바일 퍼스트 - iPhone 12 Pro
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['iPhone 12 Pro'],
        channel: 'chrome'
      },
    },
    
    // Android 모바일
    {
      name: 'Mobile Android',
      use: { 
        ...devices['Galaxy S9+'] 
      },
    },
    
    // iPad
    {
      name: 'Tablet',
      use: { 
        ...devices['iPad Pro 11'] 
      },
    },
    
    // 데스크톱 Chrome
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },
    
    // 데스크톱 Safari (macOS에서만)
    {
      name: 'Desktop Safari',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 }
      },
    },
  ],

  // 로컬 개발 서버 자동 시작 (필요시)
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});