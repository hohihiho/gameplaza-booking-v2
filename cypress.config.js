const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 390,  // iPhone 12 Pro 해상도
    viewportHeight: 844,
    video: true,
    screenshotOnRunFailure: true,
    
    // 게임플라자 특화 설정
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    
    // 테스트 파일 위치
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    setupNodeEvents(on, config) {
      // 시간 조작 플러그인
      on('task', {
        setSystemTime(timestamp) {
          // 시스템 시간 설정 (Node.js 환경)
          const originalNow = Date.now
          Date.now = () => new Date(timestamp).getTime()
          return null
        },
        
        resetSystemTime() {
          // 시간 초기화
          Date.now = Date.now.originalImplementation || Date.now
          return null
        },
        
        log(message) {
          console.log('🌊 Cypress:', message)
          return null
        }
      })
      
      // 스크린샷 경로 설정
      on('after:screenshot', (details) => {
        console.log(`📸 스크린샷 저장됨: ${details.path}`)
      })
      
      return config
    },
  },
  
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
  },
  
  // 환경별 설정
  env: {
    CYPRESS_BASE_URL: 'http://localhost:3000',
    // 테스트용 사용자 계정 (개발 환경)
    TEST_USER_EMAIL: 'test@gameplaza.dev',
    TEST_ADMIN_EMAIL: 'admin@gameplaza.dev',
  }
})