import { Page } from '@playwright/test';

export class TestSetup {
  /**
   * PWA 설치 프롬프트를 자동으로 닫습니다
   */
  static async dismissPWAPrompt(page: Page) {
    // localStorage를 사용하여 PWA 프롬프트 비활성화
    await page.addInitScript(() => {
      localStorage.setItem('pwa-install-declined', new Date().toISOString());
      localStorage.setItem('ios-install-prompt-seen', 'true');
    });
  }

  /**
   * 테스트를 위한 모의 인증 설정
   */
  static async mockAuthentication(page: Page) {
    // 테스트용 세션 쿠키 설정
    await page.context().addCookies([
      {
        name: 'next-auth.session-token',
        value: 'test-session-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax'
      }
    ]);
  }

  /**
   * 페이지 로드 전 기본 설정
   */
  static async setupPage(page: Page) {
    // PWA 프롬프트 비활성화
    await this.dismissPWAPrompt(page);
    
    // 에러 콘솔 로그 캡처
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });

    // 페이지 에러 캡처
    page.on('pageerror', error => {
      console.log('Page error:', error.message);
    });
  }

  /**
   * Google OAuth 로그인 모의
   */
  static async mockGoogleLogin(page: Page) {
    // OAuth 리다이렉트 인터셉트
    await page.route('**/api/auth/signin/google**', route => {
      route.fulfill({
        status: 302,
        headers: {
          'Location': '/'
        }
      });
    });

    // 세션 API 모의
    await page.route('**/api/auth/session', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            image: null
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
      });
    });
  }

  /**
   * 실제 요소를 기반으로 한 셀렉터 매핑
   */
  static selectors = {
    // 로그인 페이지
    googleLoginButton: 'button:has-text("Google로 계속하기")',
    
    // 네비게이션
    logo: 'h1:has-text("게임플라자")',
    navigation: 'nav',
    
    // PWA 프롬프트
    pwaPrompt: 'div:has-text("앱으로 설치하기")',
    pwaCloseButton: 'button[aria-label="Close"]',
    
    // 공통 요소
    loadingSpinner: 'div[class*="animate-spin"]',
    toast: '[role="alert"]',
    modal: '[role="dialog"]'
  };
}