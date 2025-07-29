# ⚡ 게임플라자 예약 시스템 - 성능 테스트 기준

## 🎯 성능 목표

### 기본 원칙
- **모바일 퍼스트**: 99% 모바일 사용자를 위한 최적화
- **3G 네트워크 기준**: 저속 네트워크에서도 사용 가능
- **실시간성**: 예약/상태 변경 즉시 반영
- **배터리 효율성**: 불필요한 리소스 사용 최소화

---

## 📊 Lighthouse 성능 기준

### 최소 요구사항
```yaml
모바일 (3G Throttling):
  Performance: ≥ 90점
  Accessibility: ≥ 95점
  Best Practices: ≥ 95점
  SEO: ≥ 90점

데스크톱:
  Performance: ≥ 95점
  Accessibility: ≥ 95점
  Best Practices: ≥ 95점
  SEO: ≥ 95점
```

### 핵심 지표 (Core Web Vitals)
```yaml
LCP (Largest Contentful Paint):
  Good: ≤ 2.5초
  Needs Improvement: 2.5-4.0초
  Poor: > 4.0초

FID (First Input Delay):
  Good: ≤ 100ms
  Needs Improvement: 100-300ms
  Poor: > 300ms

CLS (Cumulative Layout Shift):
  Good: ≤ 0.1
  Needs Improvement: 0.1-0.25
  Poor: > 0.25
```

---

## 🚀 페이지별 성능 기준

### 1. 메인 페이지 (/)
```yaml
초기 로드:
  - FCP: ≤ 1.8초
  - LCP: ≤ 2.5초
  - TTI: ≤ 3.8초
  - Bundle 크기: ≤ 300KB (gzipped)

사용자 상호작용:
  - 메뉴 열기: ≤ 16ms
  - 페이지 전환: ≤ 100ms
```

### 2. 예약 페이지 (/reservations/new)
```yaml
초기 로드:
  - FCP: ≤ 2.0초
  - LCP: ≤ 3.0초
  - 기기 목록 로드: ≤ 500ms

실시간 업데이트:
  - WebSocket 연결: ≤ 200ms
  - 상태 동기화: ≤ 100ms
  - 예약 생성: ≤ 300ms
```

### 3. 관리자 대시보드 (/admin)
```yaml
초기 로드:
  - 데이터 로드: ≤ 1.0초
  - 차트 렌더링: ≤ 500ms
  - 테이블 렌더링: ≤ 300ms

데이터 업데이트:
  - 필터링: ≤ 100ms
  - 정렬: ≤ 50ms
  - 페이지네이션: ≤ 200ms
```

---

## 🌐 API 성능 기준

### 응답 시간 목표
```yaml
인증 API:
  - GET /api/auth/session: ≤ 100ms
  - POST /api/auth/signin: ≤ 300ms

예약 API:
  - GET /api/v2/reservations: ≤ 200ms
  - POST /api/v2/reservations: ≤ 300ms
  - PUT /api/v2/reservations/[id]: ≤ 250ms
  - DELETE /api/v2/reservations/[id]: ≤ 200ms

기기 API:
  - GET /api/v2/devices: ≤ 150ms
  - GET /api/v2/devices/[id]/status: ≤ 100ms

관리자 API:
  - GET /api/admin/dashboard: ≤ 500ms
  - GET /api/admin/analytics: ≤ 800ms
```

### 처리량 목표
```yaml
동시 사용자:
  - 일반: 100명
  - 피크: 300명
  - 최대: 500명

API 요청:
  - 초당 요청: 1000 RPS
  - 예약 생성: 50 RPS
  - 상태 조회: 500 RPS
```

---

## 📱 모바일 성능 최적화

### 3G 네트워크 시뮬레이션
```javascript
// Playwright 설정
const networkConditions = {
  offline: false,
  downloadThroughput: 1.75 * 1024 * 1024 / 8, // 1.75 Mbps
  uploadThroughput: 750 * 1024 / 8,            // 750 Kbps
  latency: 40,                                  // 40ms RTT
};
```

### 디바이스별 성능 기준
```yaml
iPhone 12 (iOS Safari):
  - 메모리 사용량: ≤ 50MB
  - CPU 사용률: ≤ 30%
  - 배터리 효율: Good

Galaxy S21 (Android Chrome):
  - 메모리 사용량: ≤ 60MB
  - CPU 사용률: ≤ 35%
  - 배터리 효율: Good

저사양 기기 (Android 8.0):
  - 메모리 사용량: ≤ 40MB
  - CPU 사용률: ≤ 40%
  - 앱 실행 시간: ≤ 5초
```

### PWA 성능
```yaml
Service Worker:
  - 설치 시간: ≤ 2초
  - 캐시 업데이트: ≤ 5초
  - 오프라인 응답: ≤ 100ms

Push Notifications:
  - 알림 전송: ≤ 1초
  - 클릭 응답: ≤ 200ms
```

---

## 🔧 성능 테스트 도구 설정

### 1. Lighthouse CI 설정
```javascript
// lighthouse.config.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/reservations',
        'http://localhost:3000/reservations/new',
        'http://localhost:3000/admin',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'mobile',
        throttling: {
          rttMs: 40,
          throughputKbps: 1.75 * 1024,
          cpuSlowdownMultiplier: 4,
        },
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 667,
          deviceScaleFactor: 2,
        },
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        
        // Core Web Vitals
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'first-input-delay': ['error', { maxNumericValue: 100 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        
        // 기타 중요 지표
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        'interactive': ['error', { maxNumericValue: 3800 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

### 2. 성능 테스트 스크립트
```javascript
// scripts/performance-test.js
const { execSync } = require('child_process');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function runPerformanceTests() {
  console.log('🚀 Starting performance tests...');
  
  // Lighthouse CI 실행
  console.log('📊 Running Lighthouse CI...');
  execSync('npx lhci autorun', { stdio: 'inherit' });
  
  // API 성능 테스트
  console.log('🌐 Testing API performance...');
  await testApiPerformance();
  
  // 실시간 기능 테스트
  console.log('⚡ Testing real-time features...');
  await testRealtimePerformance();
  
  console.log('✅ Performance tests completed!');
}

async function testApiPerformance() {
  const endpoints = [
    'http://localhost:3000/api/v2/reservations',
    'http://localhost:3000/api/v2/devices',
    'http://localhost:3000/api/admin/dashboard',
  ];
  
  for (const endpoint of endpoints) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(endpoint);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`${endpoint}: ${responseTime}ms`);
      
      if (responseTime > 500) {
        console.warn(`⚠️  Slow response: ${endpoint} (${responseTime}ms)`);
      }
    } catch (error) {
      console.error(`❌ Failed: ${endpoint}`, error.message);
    }
  }
}
```

### 3. Playwright 성능 테스트
```typescript
// tests/performance/mobile-performance.spec.ts
import { test, expect, devices } from '@playwright/test';

test.use({
  ...devices['iPhone 12'],
  // 3G 쓰로틀링
  offline: false,
  downloadThroughput: 1.75 * 1024 * 1024 / 8,
  uploadThroughput: 750 * 1024 / 8,
  latency: 40,
});

test('모바일 성능 기준을 충족한다', async ({ page }) => {
  // Performance 측정 시작
  const startTime = Date.now();
  
  // 메인 페이지 로드
  await page.goto('/');
  
  // FCP 측정
  const firstContentfulPaint = await page.evaluate(() => {
    return performance.getEntriesByType('paint')
      .find(entry => entry.name === 'first-contentful-paint')?.startTime;
  });
  
  // LCP 측정
  const largestContentfulPaint = await page.evaluate(() => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    });
  });
  
  // 기준 검증
  expect(firstContentfulPaint).toBeLessThan(1800);
  expect(largestContentfulPaint).toBeLessThan(2500);
  
  // 예약 페이지 이동 성능
  const navigationStart = Date.now();
  await page.click('a[href="/reservations"]');
  await page.waitForLoadState('networkidle');
  const navigationTime = Date.now() - navigationStart;
  
  expect(navigationTime).toBeLessThan(1000);
});

test('실시간 기능 성능을 측정한다', async ({ page, context }) => {
  // WebSocket 연결 시간 측정
  const wsConnectStart = Date.now();
  
  await page.goto('/reservations');
  
  // WebSocket 연결 완료 대기
  await page.waitForFunction(() => {
    return window.WebSocket && 
           Array.from(window.performance.getEntriesByType('resource'))
             .some(entry => entry.name.includes('ws://') || entry.name.includes('wss://'));
  });
  
  const wsConnectTime = Date.now() - wsConnectStart;
  expect(wsConnectTime).toBeLessThan(500);
  
  // 실시간 업데이트 성능
  const updateStart = Date.now();
  
  // 다른 브라우저에서 예약 생성 시뮬레이션
  const secondPage = await context.newPage();
  await secondPage.goto('/reservations/new');
  await secondPage.fill('[name="deviceId"]', 'device-123');
  await secondPage.click('button[type="submit"]');
  
  // 첫 번째 페이지에서 업데이트 감지
  await page.waitForSelector('[data-testid="reservation-updated"]', {
    timeout: 3000,
  });
  
  const updateTime = Date.now() - updateStart;
  expect(updateTime).toBeLessThan(1000);
});
```

---

## 📈 성능 모니터링

### 1. 지속적 모니터링
```javascript
// utils/performance-monitor.js
class PerformanceMonitor {
  static trackPageLoad(pageName) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.sendMetric({
          page: pageName,
          metric: entry.name,
          value: entry.startTime,
          timestamp: Date.now(),
        });
      }
    });
    
    observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
  }
  
  static trackApiCall(endpoint, startTime, endTime) {
    const duration = endTime - startTime;
    
    this.sendMetric({
      type: 'api',
      endpoint,
      duration,
      timestamp: Date.now(),
    });
    
    // 임계값 초과 시 경고
    if (duration > 500) {
      console.warn(`Slow API call: ${endpoint} (${duration}ms)`);
    }
  }
  
  static sendMetric(data) {
    // 메트릭을 분석 서비스로 전송
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'performance_metric', {
        custom_parameter: JSON.stringify(data)
      });
    }
  }
}
```

### 2. Real User Monitoring (RUM)
```typescript
// hooks/usePerformanceTracking.ts
import { useEffect } from 'react';

export function usePerformanceTracking(pageName: string) {
  useEffect(() => {
    // Core Web Vitals 측정
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(sendToAnalytics);
      getFID(sendToAnalytics);
      getFCP(sendToAnalytics);
      getLCP(sendToAnalytics);
      getTTFB(sendToAnalytics);
    });
    
    function sendToAnalytics(metric: any) {
      // 분석 서비스로 전송
      console.log(`[${pageName}] ${metric.name}: ${metric.value}`);
    }
  }, [pageName]);
}
```

---

## 🚨 성능 임계값 알림

### CI/CD 파이프라인 통합
```yaml
# .github/workflows/performance.yml
name: Performance Tests

on: [push, pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: npm start &
        
      - name: Wait for server
        run: sleep 10
      
      - name: Run Lighthouse CI
        run: npx lhci autorun
        
      - name: Check performance budget
        run: |
          if [ -f ".lighthouseci/results.json" ]; then
            node scripts/check-performance-budget.js
          fi
```

### 성능 예산 체크
```javascript
// scripts/check-performance-budget.js
const fs = require('fs');
const path = require('path');

const PERFORMANCE_BUDGET = {
  'largest-contentful-paint': 2500,
  'first-input-delay': 100,
  'cumulative-layout-shift': 0.1,
  'first-contentful-paint': 1800,
  'speed-index': 3000,
  'interactive': 3800,
};

function checkPerformanceBudget() {
  const resultsPath = '.lighthouseci/results.json';
  
  if (!fs.existsSync(resultsPath)) {
    console.error('❌ Lighthouse results not found');
    process.exit(1);
  }
  
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  let hasFailures = false;
  
  for (const result of results) {
    const audits = result.audits;
    
    for (const [metric, budget] of Object.entries(PERFORMANCE_BUDGET)) {
      const audit = audits[metric];
      
      if (audit && audit.numericValue > budget) {
        console.error(`❌ ${metric}: ${audit.numericValue}ms (budget: ${budget}ms)`);
        hasFailures = true;
      } else if (audit) {
        console.log(`✅ ${metric}: ${audit.numericValue}ms`);
      }
    }
  }
  
  if (hasFailures) {
    console.error('\n💥 Performance budget exceeded!');
    process.exit(1);
  } else {
    console.log('\n🎉 All performance budgets met!');
  }
}

checkPerformanceBudget();
```

---

## 📋 성능 테스트 체크리스트

### 개발 단계
- [ ] Core Web Vitals 측정
- [ ] API 응답 시간 확인
- [ ] 번들 크기 모니터링
- [ ] 메모리 사용량 체크

### PR 단계
- [ ] Lighthouse CI 통과
- [ ] 성능 예산 준수
- [ ] 모바일 성능 확인
- [ ] 회귀 성능 테스트

### 배포 전
- [ ] 프로덕션 환경 성능 테스트
- [ ] CDN 캐시 확인
- [ ] 부하 테스트
- [ ] 실시간 기능 성능 검증