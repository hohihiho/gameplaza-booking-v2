# 📱 게임플라자 예약 시스템 - 모바일 테스트 전략

## 🎯 모바일 테스트 목표

### 핵심 원칙
- **모바일 퍼스트**: 99% 모바일 사용자를 위한 철저한 테스트
- **실제 환경 시뮬레이션**: 3G 네트워크, 저사양 기기, 실제 사용 패턴
- **터치 최적화**: 손가락 터치에 최적화된 인터페이스 검증
- **PWA 기능**: 오프라인, 푸시 알림, 홈스크린 추가 테스트

---

## 📊 테스트 디바이스 매트릭스

### 1. 우선순위 디바이스
```yaml
High Priority (필수 테스트):
  iPhone:
    - iPhone 12/13/14 (iOS 15+, Safari)
    - iPhone SE 3rd Gen (소형 화면 대표)
    
  Android:
    - Galaxy S21/S22 (Android 11+, Chrome)
    - Galaxy A52 (중급 기기 대표)
    - Pixel 6 (순정 안드로이드)

Medium Priority (선택 테스트):
  iPad:
    - iPad Pro 11" (태블릿 대표)
    - iPad Mini (소형 태블릿)
    
  저사양 Android:
    - Android 8.0+ (최소 지원 버전)
    - 2GB RAM 기기
```

### 2. 네트워크 조건
```yaml
3G Slow (우선순위 1):
  - Download: 400 Kbps
  - Upload: 200 Kbps  
  - Latency: 400ms

3G (기본 테스트):
  - Download: 1.75 Mbps
  - Upload: 750 Kbps
  - Latency: 40ms

4G (최적 조건):
  - Download: 50 Mbps
  - Upload: 10 Mbps
  - Latency: 20ms

Offline (PWA 테스트):
  - 완전 오프라인 상태
  - 간헐적 연결 끊김
```

---

## 🧪 Playwright 모바일 테스트 설정

### 1. 기본 모바일 설정
```typescript
// playwright.config.ts - 모바일 프로젝트 추가
export default defineConfig({
  projects: [
    // iPhone 12 - 3G 네트워크
    {
      name: 'iPhone 12 - 3G',
      use: { 
        ...devices['iPhone 12'],
        // 3G 네트워크 쓰로틀링
        offline: false,
        downloadThroughput: 1.75 * 1024 * 1024 / 8,
        uploadThroughput: 750 * 1024 / 8,
        latency: 40,
        // 모바일 특화 설정
        hasTouch: true,
        isMobile: true,
        contextOptions: {
          permissions: ['notifications', 'geolocation'],
        },
      },
    },
    
    // iPhone SE - 소형 화면
    {
      name: 'iPhone SE - Small Screen',
      use: {
        ...devices['iPhone SE'],
        // 느린 3G 시뮬레이션
        offline: false,
        downloadThroughput: 400 * 1024 / 8,
        uploadThroughput: 200 * 1024 / 8,
        latency: 400,
      },
    },
    
    // Galaxy S21 - Android Chrome
    {
      name: 'Galaxy S21 - Android',
      use: {
        ...devices['Galaxy S21'],
        // 일반 3G
        offline: false,
        downloadThroughput: 1.75 * 1024 * 1024 / 8,
        uploadThroughput: 750 * 1024 / 8,
        latency: 40,
      },
    },
    
    // 저사양 Android 시뮬레이션
    {
      name: 'Low-end Android',
      use: {
        browserName: 'chromium',
        viewport: { width: 360, height: 640 },
        userAgent: 'Mozilla/5.0 (Linux; Android 8.0; SM-G950F) AppleWebKit/537.36',
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        // 매우 느린 네트워크
        offline: false,
        downloadThroughput: 200 * 1024 / 8,
        uploadThroughput: 100 * 1024 / 8,
        latency: 800,
      },
    },
  ],
});
```

### 2. 모바일 특화 테스트 헬퍼
```typescript
// tests/helpers/mobile-helpers.ts
import { Page, expect } from '@playwright/test';

export class MobileTestHelper {
  constructor(private page: Page) {}
  
  // 터치 제스처 테스트
  async testTouchGestures() {
    // 탭 제스처
    await this.page.locator('[data-testid="menu-button"]').tap();
    await expect(this.page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // 스와이프 제스처 (메뉴 닫기)
    await this.page.touchscreen.swipe(
      { x: 300, y: 200 }, // 시작점
      { x: 50, y: 200 },  // 끝점
      { steps: 10 }       // 스와이프 단계
    );
    await expect(this.page.locator('[data-testid="mobile-menu"]')).not.toBeVisible();
  }
  
  // 세로/가로 화면 회전 테스트
  async testOrientationChange() {
    // 세로 모드
    await this.page.setViewportSize({ width: 375, height: 667 });
    await expect(this.page.locator('[data-testid="mobile-layout"]')).toBeVisible();
    
    // 가로 모드
    await this.page.setViewportSize({ width: 667, height: 375 });
    await expect(this.page.locator('[data-testid="landscape-layout"]')).toBeVisible();
  }
  
  // 가상 키보드 테스트
  async testVirtualKeyboard() {
    const input = this.page.locator('input[type="text"]');
    
    // 포커스 시 키보드 표시
    await input.tap();
    
    // 뷰포트 크기 변경 확인 (가상 키보드로 인한)
    const viewport = this.page.viewportSize();
    await this.page.waitForFunction(() => {
      return window.visualViewport?.height < window.screen.height;
    });
    
    // 입력 필드가 가려지지 않는지 확인
    await expect(input).toBeInViewport();
  }
  
  // 네트워크 상태 변경 테스트
  async testNetworkChanges() {
    // 오프라인으로 전환
    await this.page.context().setOffline(true);
    
    // 오프라인 UI 표시 확인
    await expect(this.page.locator('[data-testid="offline-banner"]')).toBeVisible();
    
    // 온라인으로 복구
    await this.page.context().setOffline(false);
    
    // 자동 동기화 확인
    await expect(this.page.locator('[data-testid="sync-indicator"]')).toBeVisible();
  }
  
  // 성능 측정
  async measureMobilePerformance() {
    // 페이지 로드 시간 측정
    const startTime = Date.now();
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // 3G 환경에서 3초 이내 로드
    expect(loadTime).toBeLessThan(3000);
    
    // 터치 응답 시간 측정
    const touchStart = Date.now();
    await this.page.locator('button').first().tap();
    await this.page.waitForSelector('[data-testid="button-response"]');
    const touchResponse = Date.now() - touchStart;
    
    // 100ms 이내 응답
    expect(touchResponse).toBeLessThan(100);
  }
}
```

---

## 🧪 모바일 테스트 케이스

### 1. 핵심 사용자 플로우 테스트
```typescript
// tests/e2e/mobile/reservation-flow.spec.ts
import { test, expect, devices } from '@playwright/test';
import { MobileTestHelper } from '../../helpers/mobile-helpers';

test.describe('모바일 예약 플로우', () => {
  test.use(devices['iPhone 12']);
  
  test('iPhone에서 전체 예약 프로세스를 완료할 수 있다', async ({ page }) => {
    const mobile = new MobileTestHelper(page);
    
    // 1. 앱 로드 및 성능 측정
    await mobile.measureMobilePerformance();
    
    // 2. 로그인 (구글 OAuth)
    await page.goto('/');
    await page.tap('[data-testid="login-button"]');
    
    // 모바일에서 OAuth 팝업 처리
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.tap('[data-testid="google-login"]'),
    ]);
    
    await popup.fill('input[type="email"]', 'test@gmail.com');
    await popup.tap('button[type="submit"]');
    await popup.close();
    
    // 3. 기기 목록 - 모바일 최적화 UI
    await expect(page.locator('[data-testid="device-grid"]')).toBeVisible();
    
    // 수평 스크롤 테스트
    const deviceGrid = page.locator('[data-testid="device-grid"]');
    await deviceGrid.swipe({ direction: 'left' });
    
    // 기기 선택 (터치 친화적 크기)
    const deviceCard = page.locator('[data-testid="device-card"]').first();
    await expect(deviceCard).toHaveCSS('min-height', '120px'); // 44px 이상 터치 영역
    await deviceCard.tap();
    
    // 4. 시간 선택 - 모바일 시간 피커
    await expect(page.locator('[data-testid="time-picker"]')).toBeVisible();
    
    // 시간 슬라이더 사용
    const timeSlider = page.locator('[data-testid="time-slider"]');
    await timeSlider.dragTo(page.locator('[data-testid="14-00"]'));
    
    // 5. 예약 확인 - 모바일 바텀시트
    await page.tap('[data-testid="reserve-button"]');
    
    // 바텀시트 애니메이션 대기
    await expect(page.locator('[data-testid="confirmation-sheet"]')).toBeVisible();
    await page.tap('[data-testid="confirm-reservation"]');
    
    // 6. 성공 메시지 및 햅틱 피드백
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // 푸시 알림 권한 요청 시뮬레이션
    await page.evaluate(() => {
      // 브라우저 알림 권한 시뮬레이션
      Object.defineProperty(Notification, 'permission', {
        value: 'granted',
        writable: false,
      });
    });
  });
  
  test('3G 느린 네트워크에서도 사용 가능하다', async ({ page }) => {
    // 매우 느린 3G 설정
    await page.route('**/*', async (route) => {
      // API 응답 지연 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });
    
    await page.goto('/');
    
    // 로딩 스피너 표시 확인
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // 데이터 로드 완료 대기
    await page.waitForSelector('[data-testid="device-list"]', { timeout: 10000 });
    
    // 캐시된 데이터 즉시 표시 확인
    await expect(page.locator('[data-testid="cached-data"]')).toBeVisible();
  });
});
```

### 2. PWA 기능 테스트
```typescript
// tests/e2e/mobile/pwa-features.spec.ts
import { test, expect } from '@playwright/test';

test.describe('PWA 기능 테스트', () => {
  test('홈스크린에 추가할 수 있다', async ({ page, context }) => {
    await page.goto('/');
    
    // PWA 설치 프롬프트 트리거
    await page.evaluate(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'));
    });
    
    // 설치 배너 표시 확인
    await expect(page.locator('[data-testid="install-banner"]')).toBeVisible();
    
    // 설치 버튼 클릭
    await page.tap('[data-testid="install-app"]');
    
    // 설치 확인 대화상자 (브라우저별 다름)
    // 실제 설치는 시뮬레이션으로만 가능
  });
  
  test('오프라인에서도 기본 기능을 사용할 수 있다', async ({ page, context }) => {
    // 온라인에서 먼저 방문 (캐시 생성)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 오프라인으로 전환
    await context.setOffline(true);
    
    // 페이지 새로고침 (캐시된 버전 로드)
    await page.reload();
    
    // 오프라인 배너 표시
    await expect(page.locator('[data-testid="offline-banner"]')).toBeVisible();
    
    // 캐시된 예약 목록 표시
    await expect(page.locator('[data-testid="cached-reservations"]')).toBeVisible();
    
    // 오프라인 전용 기능 테스트
    await page.tap('[data-testid="offline-mode-button"]');
    await expect(page.locator('[data-testid="offline-features"]')).toBeVisible();
  });
  
  test('푸시 알림을 받을 수 있다', async ({ page, context }) => {
    // 알림 권한 승인
    await context.grantPermissions(['notifications']);
    
    await page.goto('/');
    
    // 알림 구독 요청
    await page.tap('[data-testid="enable-notifications"]');
    
    // Service Worker 등록 확인
    const serviceWorkerPromise = page.waitForEvent('worker');
    await page.evaluate(() => {
      navigator.serviceWorker.register('/sw.js');
    });
    const worker = await serviceWorkerPromise;
    
    // 푸시 구독 시뮬레이션
    await page.evaluate(() => {
      // 푸시 이벤트 시뮬레이션
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('예약 알림', {
          body: '예약 시간 10분 전입니다.',
          icon: '/icon-192.png',
          badge: '/badge.png',
          tag: 'reservation-reminder',
        });
      });
    });
  });
});
```

### 3. 접근성 테스트
```typescript
// tests/e2e/mobile/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('모바일 접근성 테스트', () => {
  test('터치 대상 크기가 적절하다', async ({ page }) => {
    await page.goto('/');
    
    // 모든 터치 가능한 요소 검사
    const touchTargets = page.locator('button, a, input, [role="button"]');
    const count = await touchTargets.count();
    
    for (let i = 0; i < count; i++) {
      const element = touchTargets.nth(i);
      const box = await element.boundingBox();
      
      if (box) {
        // 최소 44x44px 터치 영역 (WCAG 기준)
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
  
  test('색상 대비가 충분하다', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
    
    // 색상 대비 검사
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true },
        'color-contrast-enhanced': { enabled: true },
      },
    });
  });
  
  test('스크린 리더가 올바르게 읽는다', async ({ page }) => {
    await page.goto('/');
    
    // ARIA 레이블 확인
    const deviceCard = page.locator('[data-testid="device-card"]').first();
    await expect(deviceCard).toHaveAttribute('aria-label');
    
    // 헤딩 구조 확인
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1); // 페이지당 h1은 하나만
    
    // 포커스 순서 확인
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'A', 'INPUT']).toContain(firstFocused);
  });
});
```

---

## 📊 모바일 성능 벤치마크

### 1. 디바이스별 성능 기준
```typescript
// tests/performance/mobile-benchmarks.spec.ts
import { test, expect, devices } from '@playwright/test';

const PERFORMANCE_BUDGETS = {
  'iPhone 12': {
    loadTime: 2500,
    fcp: 1500,
    lcp: 2000,
    memoryUsage: 50 * 1024 * 1024, // 50MB
  },
  'iPhone SE': {
    loadTime: 3000,
    fcp: 1800,
    lcp: 2500,
    memoryUsage: 40 * 1024 * 1024, // 40MB
  },
  'Low-end Android': {
    loadTime: 4000,
    fcp: 2500,
    lcp: 3500,
    memoryUsage: 60 * 1024 * 1024, // 60MB
  },
};

Object.entries(PERFORMANCE_BUDGETS).forEach(([deviceName, budget]) => {
  test(`${deviceName} 성능 기준을 충족한다`, async ({ page }) => {
    // 디바이스별 설정 적용
    if (deviceName === 'iPhone 12') {
      await page.emulate(devices['iPhone 12']);
    } else if (deviceName === 'iPhone SE') {
      await page.emulate(devices['iPhone SE']);
    }
    
    // 성능 측정 시작
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(budget.loadTime);
    
    // Core Web Vitals 측정
    const fcp = await page.evaluate(() => {
      return performance.getEntriesByType('paint')
        .find(entry => entry.name === 'first-contentful-paint')?.startTime;
    });
    
    if (fcp) {
      expect(fcp).toBeLessThan(budget.fcp);
    }
    
    // 메모리 사용량 (근사치)
    const jsHeapSize = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    if (jsHeapSize > 0) {
      expect(jsHeapSize).toBeLessThan(budget.memoryUsage);
    }
  });
});
```

### 2. 네트워크 조건별 테스트
```typescript
// tests/performance/network-conditions.spec.ts
import { test, expect } from '@playwright/test';

const NETWORK_CONDITIONS = [
  {
    name: '3G Slow',
    downloadThroughput: 400 * 1024 / 8,
    uploadThroughput: 200 * 1024 / 8,
    latency: 400,
    maxLoadTime: 5000,
  },
  {
    name: '3G',
    downloadThroughput: 1.75 * 1024 * 1024 / 8,
    uploadThroughput: 750 * 1024 / 8,
    latency: 40,
    maxLoadTime: 3000,
  },
  {
    name: '4G',
    downloadThroughput: 50 * 1024 * 1024 / 8,
    uploadThroughput: 10 * 1024 * 1024 / 8,
    latency: 20,
    maxLoadTime: 1500,
  },
];

NETWORK_CONDITIONS.forEach(condition => {
  test(`${condition.name} 네트워크에서 성능 기준을 충족한다`, async ({ page, context }) => {
    // 네트워크 조건 설정
    await context.route('**/*', async (route) => {
      // 레이턴시 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, condition.latency));
      await route.continue();
    });
    
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForSelector('[data-testid="main-content"]');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(condition.maxLoadTime);
    
    // 점진적 로딩 확인
    await expect(page.locator('[data-testid="skeleton-loader"]')).toBeVisible();
    await expect(page.locator('[data-testid="content-loaded"]')).toBeVisible();
  });
});
```

---

## 🔧 모바일 테스트 자동화

### 1. GitHub Actions 모바일 테스트
```yaml
# .github/workflows/mobile-tests.yml
name: Mobile Tests

on: [push, pull_request]

jobs:
  mobile-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        device: ['iPhone 12', 'Galaxy S21', 'iPhone SE']
        network: ['3G', '3G Slow']
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install
      
      - name: Build application
        run: npm run build
      
      - name: Start dev server
        run: npm run dev &
        
      - name: Wait for server
        run: sleep 10
      
      - name: Run mobile tests
        run: npx playwright test --project="${{ matrix.device }}" --grep="mobile"
        env:
          NETWORK_CONDITION: ${{ matrix.network }}
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: mobile-test-results-${{ matrix.device }}-${{ matrix.network }}
          path: test-results/
```

### 2. 모바일 테스트 리포트
```typescript
// scripts/mobile-test-report.ts
import fs from 'fs';
import path from 'path';

interface MobileTestResult {
  device: string;
  network: string;
  loadTime: number;
  fcp: number;
  lcp: number;
  passed: boolean;
  errors: string[];
}

class MobileTestReporter {
  private results: MobileTestResult[] = [];
  
  addResult(result: MobileTestResult) {
    this.results.push(result);
  }
  
  generateReport() {
    const report = {
      summary: this.generateSummary(),
      details: this.results,
      recommendations: this.generateRecommendations(),
    };
    
    const reportPath = path.join('test-results', 'mobile-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('📱 Mobile Test Report Generated');
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Passed: ${this.results.filter(r => r.passed).length}`);
    console.log(`Failed: ${this.results.filter(r => !r.passed).length}`);
  }
  
  private generateSummary() {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    return {
      passRate: (passed / total) * 100,
      averageLoadTime: this.calculateAverage('loadTime'),
      averageFCP: this.calculateAverage('fcp'),
      averageLCP: this.calculateAverage('lcp'),
    };
  }
  
  private calculateAverage(metric: keyof MobileTestResult) {
    const values = this.results
      .map(r => r[metric])
      .filter(v => typeof v === 'number') as number[];
    
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  private generateRecommendations() {
    const recommendations = [];
    
    const slowDevices = this.results.filter(r => r.loadTime > 3000);
    if (slowDevices.length > 0) {
      recommendations.push({
        type: 'performance',
        message: `${slowDevices.length}개 디바이스에서 로드 시간이 3초를 초과했습니다.`,
        devices: slowDevices.map(d => d.device),
      });
    }
    
    const highFCP = this.results.filter(r => r.fcp > 2000);
    if (highFCP.length > 0) {
      recommendations.push({
        type: 'optimization',
        message: 'First Contentful Paint 최적화가 필요합니다.',
        suggestion: 'Critical CSS 인라인화, 이미지 최적화 검토',
      });
    }
    
    return recommendations;
  }
}
```

---

## 📋 모바일 테스트 체크리스트

### 개발 단계
- [ ] 터치 대상 크기 (최소 44px)
- [ ] 가상 키보드 대응
- [ ] 세로/가로 모드 지원
- [ ] 스와이프 제스처 구현

### 기능 테스트
- [ ] 모든 기능이 터치로 접근 가능
- [ ] 네트워크 상태 변경 대응
- [ ] 배터리 절약 모드 고려
- [ ] 백그라운드/포그라운드 전환

### 성능 테스트
- [ ] 3G 환경에서 3초 이내 로드
- [ ] 메모리 사용량 60MB 이하
- [ ] 터치 응답 100ms 이하
- [ ] 부드러운 스크롤 (60fps)

### PWA 테스트
- [ ] 홈스크린 추가 가능
- [ ] 오프라인 기본 기능 동작
- [ ] 푸시 알림 수신
- [ ] 캐시 전략 검증

### 접근성 테스트
- [ ] 스크린 리더 호환성
- [ ] 색상 대비 충족
- [ ] 키보드 네비게이션
- [ ] 포커스 관리

### 디바이스별 테스트
- [ ] iPhone (Safari) 테스트
- [ ] Android (Chrome) 테스트
- [ ] 태블릿 레이아웃 확인
- [ ] 저사양 기기 성능 확인