import { Page } from '@playwright/test';
import { TestSetup } from '../fixtures/test-setup';

export class TestHelpers {
  static async login(page: Page, email: string = 'test@example.com') {
    // 테스트 환경에서는 실제 OAuth를 사용할 수 없으므로 모의 로그인
    await TestSetup.mockGoogleLogin(page);
    await TestSetup.mockAuthentication(page);
    
    // 홈페이지로 이동하여 로그인 상태 확인
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  }

  static async logout(page: Page) {
    await page.click('[data-testid="profile-button"]');
    await page.click('[data-testid="logout-button"]');
    await page.waitForURL('/');
  }

  static async mockApiResponse(page: Page, url: string, response: any) {
    await page.route(url, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  static async waitForRealtimeUpdate(page: Page, timeout: number = 5000) {
    await page.waitForTimeout(timeout);
  }

  static getTomorrowDate(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  static formatTimeFor24HourDisplay(hour: number): string {
    // 24-29시 표시 체계 지원
    if (hour >= 0 && hour < 6) {
      return `${24 + hour}시`;
    }
    return `${hour}시`;
  }

  static async checkMobileViewport(page: Page) {
    const viewport = page.viewportSize();
    return viewport && viewport.width < 768;
  }

  static async waitForToast(page: Page): Promise<string> {
    const toast = page.locator('[data-testid*="toast"], .toast, [role="alert"]');
    await toast.waitFor({ state: 'visible', timeout: 5000 });
    return await toast.textContent() || '';
  }

  static async setMobileViewport(page: Page, device: 'iPhone12' | 'GalaxyS20' | 'iPad' = 'iPhone12') {
    const viewports = {
      iPhone12: { width: 390, height: 844 },
      GalaxyS20: { width: 360, height: 800 },
      iPad: { width: 768, height: 1024 }
    };
    
    await page.setViewportSize(viewports[device]);
  }

  static async measurePerformance(page: Page) {
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    return metrics;
  }
}