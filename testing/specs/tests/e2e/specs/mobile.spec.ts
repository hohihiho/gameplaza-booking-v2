import { test, expect, devices, BrowserContext } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { ReservationPage } from '../pages/reservation.page';
import { TestHelpers } from '../utils/test-helpers';

test.describe('모바일 브라우저 테스트', () => {
  test('모바일 홈페이지 레이아웃', async ({ browser }) => {
    // iPhone 12 컨텍스트 생성
    const context = await browser.newContext({
      ...devices['iPhone 12']
    });
    const page = await context.newPage();
    
    await page.goto('/');
    
    // 모바일 뷰포트 확인
    const isMobile = await TestHelpers.checkMobileViewport(page);
    expect(isMobile).toBeTruthy();
    
    // 하단 네비게이션 바 확인
    const bottomNav = page.locator('[data-testid="bottom-navigation"]');
    await expect(bottomNav).toBeVisible();
    
    // 햄버거 메뉴 확인
    const hamburgerMenu = page.locator('[data-testid="hamburger-menu"]');
    await expect(hamburgerMenu).toBeVisible();
    
    // 데스크톱 네비게이션은 숨겨져야 함
    const desktopNav = page.locator('[data-testid="desktop-navigation"]');
    await expect(desktopNav).toBeHidden();
    
    await context.close();
  });

  test('터치 타겟 크기 검증', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12']
    });
    const page = await context.newPage();
    
    await page.goto('/');
    
    // 모든 버튼과 링크의 크기 확인
    const touchTargets = await page.$$('button, a, [role="button"]');
    
    for (const target of touchTargets) {
      const box = await target.boundingBox();
      if (box) {
        // 최소 44x44px 크기 확인
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
    
    await context.close();
  });

  test('모바일 예약 플로우', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12']
    });
    const page = await context.newPage();
    
    const reservationPage = new ReservationPage(page);
    await TestHelpers.login(page);
    
    // 예약 페이지로 이동
    await reservationPage.navigateToReservation();
    
    // 모바일에서 시간 선택 UI 확인
    const timeGrid = page.locator('[data-testid="time-grid"]');
    await expect(timeGrid).toBeVisible();
    
    // 터치로 시간 선택
    await page.tap('[data-testid="time-14"]');
    
    // 선택된 시간 표시 확인
    const selectedTime = await reservationPage.getSelectedTime();
    expect(selectedTime).toContain('14시');
    
    // 스크롤하여 제출 버튼까지 이동
    await page.locator('[data-testid="submit-reservation"]').scrollIntoViewIfNeeded();
    
    // 예약 제출
    await page.tap('[data-testid="submit-reservation"]');
    
    await context.close();
  });

  test('모바일 입력 필드 최적화', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12']
    });
    const page = await context.newPage();
    
    await page.goto('/login');
    
    // 이메일 입력 필드
    const emailInput = page.locator('[data-testid="email-input"]');
    const emailType = await emailInput.getAttribute('type');
    expect(emailType).toBe('email'); // 모바일 키보드 최적화
    
    // 폰트 크기 확인 (16px 이상이어야 줌 방지)
    const fontSize = await emailInput.evaluate(el => {
      return window.getComputedStyle(el).fontSize;
    });
    expect(parseInt(fontSize)).toBeGreaterThanOrEqual(16);
    
    await context.close();
  });

  test('스와이프 제스처 지원', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
      hasTouch: true
    });
    const page = await context.newPage();
    
    await page.goto('/schedule');
    
    const calendar = page.locator('[data-testid="calendar"]');
    const initialWeek = await page.textContent('[data-testid="current-week"]');
    
    // 스와이프 시뮬레이션
    const box = await calendar.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width - 50, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 50, box.y + box.height / 2, { steps: 10 });
      await page.mouse.up();
    }
    
    // 주가 변경되었는지 확인
    await page.waitForTimeout(500);
    const newWeek = await page.textContent('[data-testid="current-week"]');
    expect(newWeek).not.toBe(initialWeek);
    
    await context.close();
  });

  test('Pull to Refresh', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
      hasTouch: true
    });
    const page = await context.newPage();
    
    await page.goto('/reservations');
    
    // Pull to refresh 동작 시뮬레이션
    await page.touchscreen.tap(200, 100);
    await page.touchscreen.swipe({
      startX: 200,
      startY: 100,
      endX: 200,
      endY: 300,
      steps: 10
    });
    
    // 새로고침 인디케이터 확인
    const refreshIndicator = page.locator('[data-testid="refresh-indicator"]');
    await expect(refreshIndicator).toBeVisible();
    
    // 데이터 새로고침 완료 대기
    await expect(refreshIndicator).toBeHidden({ timeout: 5000 });
    
    await context.close();
  });
});

test.describe('다양한 모바일 디바이스', () => {
  const mobileDevices = [
    { name: 'iPhone SE', device: devices['iPhone SE'] },
    { name: 'Samsung Galaxy S20', device: devices['Galaxy S20'] },
    { name: 'iPad Pro', device: devices['iPad Pro'] }
  ];

  for (const { name, device } of mobileDevices) {
    test(`${name} 레이아웃 테스트`, async ({ browser }) => {
      const context = await browser.newContext(device);
      const page = await context.newPage();
      
      await page.goto('/');
      
      // 스크린샷 촬영
      await page.screenshot({ 
        path: `screenshots/mobile-${name.replace(' ', '-').toLowerCase()}.png`,
        fullPage: true 
      });
      
      // 기본 요소들이 표시되는지 확인
      await expect(page.locator('[data-testid="logo"]')).toBeVisible();
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      
      await context.close();
    });
  }
});

test.describe('모바일 성능 최적화', () => {
  test('모바일 이미지 최적화', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12']
    });
    const page = await context.newPage();
    
    await page.goto('/');
    
    const images = await page.$$('img');
    
    for (const img of images) {
      // srcset 속성 확인 (반응형 이미지)
      const srcset = await img.getAttribute('srcset');
      expect(srcset).toBeTruthy();
      
      // WebP 포맷 지원 확인
      const src = await img.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        expect(src).toMatch(/\.(webp|jpg|jpeg|png)$/i);
      }
    }
    
    await context.close();
  });

  test('모바일 네트워크 사용량', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12']
    });
    const page = await context.newPage();
    
    const resourceSizes: number[] = [];
    
    page.on('response', response => {
      const size = response.headers()['content-length'];
      if (size) {
        resourceSizes.push(parseInt(size));
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 전체 리소스 크기 계산
    const totalSize = resourceSizes.reduce((sum, size) => sum + size, 0);
    const totalSizeMB = totalSize / (1024 * 1024);
    
    // 모바일에서는 1MB 이하로 제한
    expect(totalSizeMB).toBeLessThan(1);
    
    await context.close();
  });

  test('오프라인 모드 지원', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12']
    });
    const page = await context.newPage();
    
    await page.goto('/');
    
    // 오프라인 모드로 전환
    await context.setOffline(true);
    
    // 페이지 새로고침
    await page.reload();
    
    // 오프라인 메시지 표시 확인
    const offlineMessage = page.locator('[data-testid="offline-message"]');
    await expect(offlineMessage).toBeVisible();
    await expect(offlineMessage).toContainText('오프라인');
    
    // 온라인으로 복귀
    await context.setOffline(false);
    await page.waitForTimeout(1000);
    
    // 오프라인 메시지 사라짐 확인
    await expect(offlineMessage).toBeHidden();
    
    await context.close();
  });
});