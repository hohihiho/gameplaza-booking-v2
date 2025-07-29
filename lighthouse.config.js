module.exports = {
  ci: {
    collect: {
      // 테스트할 URL 목록
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/reservations',
        'http://localhost:3000/reservations/new',
        'http://localhost:3000/admin',
        'http://localhost:3000/machines',
      ],
      numberOfRuns: 3, // 각 URL당 3번 실행하여 평균 계산
      settings: {
        // 모바일 기준 테스트
        preset: 'mobile',
        throttling: {
          rttMs: 40,              // 40ms 레이턴시
          throughputKbps: 1.75 * 1024, // 1.75 Mbps 다운로드
          cpuSlowdownMultiplier: 4,     // CPU 4배 느리게
        },
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 667,
          deviceScaleFactor: 2,
          disabled: false,
        },
        emulatedUserAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        // Chrome 플래그 설정
        chromeFlags: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--headless',
        ],
      },
    },
    assert: {
      // 기본 권장 사항 + 커스텀 기준
      preset: 'lighthouse:recommended',
      assertions: {
        // Core Web Vitals
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'first-input-delay': ['error', { maxNumericValue: 100 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        
        // 추가 성능 지표
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        'interactive': ['error', { maxNumericValue: 3800 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        
        // 카테고리별 점수
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        
        // PWA 관련 (해당되는 경우)
        'categories:pwa': ['warn', { minScore: 0.8 }],
        
        // 리소스 크기 제한
        'resource-summary:document:size': ['warn', { maxNumericValue: 50000 }],
        'resource-summary:script:size': ['error', { maxNumericValue: 300000 }],
        'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 50000 }],
        'resource-summary:image:size': ['warn', { maxNumericValue: 500000 }],
        
        // 중요한 개별 audit
        'unused-javascript': ['warn', { maxNumericValue: 100000 }],
        'unused-css-rules': ['warn', { maxNumericValue: 50000 }],
        'unminified-css': ['error', { maxNumericValue: 0 }],
        'unminified-javascript': ['error', { maxNumericValue: 0 }],
        'render-blocking-resources': ['warn', { maxNumericValue: 500 }],
        'uses-optimized-images': ['warn', { maxNumericValue: 100000 }],
        'uses-webp-images': ['warn', { maxNumericValue: 100000 }],
        'uses-text-compression': ['error', { maxNumericValue: 0 }],
        'modern-image-formats': ['warn', { maxNumericValue: 100000 }],
        
        // 접근성 관련
        'color-contrast': ['error', { minScore: 1 }],
        'tap-targets': ['error', { minScore: 1 }],
        'accessible-names': ['error', { minScore: 1 }],
        
        // 모바일 친화성
        'viewport': ['error', { minScore: 1 }],
        'content-width': ['error', { minScore: 1 }],
      },
    },
    upload: {
      // GitHub Pages 또는 Netlify에 결과 업로드 (선택사항)
      target: 'temporary-public-storage',
      // target: 'filesystem',
      // outputDir: './lighthouse-reports',
    },
    server: {
      // CI 환경에서 서버 설정
      port: 3000,
      command: 'npm start',
      // 서버 준비 대기 시간
      waitForInitialBuild: true,
    },
  },
  
  // 페이지별 특별 설정
  overrides: {
    // 관리자 페이지는 조금 더 관대한 기준
    'http://localhost:3000/admin': {
      assert: {
        assertions: {
          'categories:performance': ['warn', { minScore: 0.8 }],
          'largest-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        },
      },
    },
    
    // 예약 생성 페이지는 인터랙션이 많으므로 FID 기준 완화
    'http://localhost:3000/reservations/new': {
      assert: {
        assertions: {
          'first-input-delay': ['warn', { maxNumericValue: 150 }],
          'total-blocking-time': ['warn', { maxNumericValue: 400 }],
        },
      },
    },
  },
};