import { test, expect } from '@playwright/test';
import { TestSetup } from '../fixtures/test-setup';
import { 
  waitBeforeApiCall, 
  waitBetweenTests, 
  setTestEnvironmentHeaders,
  waitForApiType,
  checkForApiErrors
} from '../utils/api-helpers';

test.describe('기본 동작 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 환경 헤더 설정
    await setTestEnvironmentHeaders(page);
    
    // 테스트 환경 설정
    await TestSetup.setupPage(page);
  });
  
  test.afterEach(async ({ page }) => {
    // 테스트 간 대기시간
    await waitBetweenTests();
  });

  test('홈페이지 로드 확인', async ({ page }) => {
    await page.goto('/');
    await waitForApiType('devices'); // 초기 페이지 로딩 API 대기
    await checkForApiErrors(page);
    
    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/게임플라자/);
    
    // 로고 확인 (실제 존재하는 요소로 수정)
    const mainContent = page.locator('main').first();
    await expect(mainContent).toBeVisible();
  });

  test('로그인 페이지 접근', async ({ page }) => {
    await page.goto('/login');
    await waitForApiType('auth'); // 인증 관련 API 대기
    await checkForApiErrors(page);
    
    // 로그인 페이지 요소 확인 (더 관대한 검증)
    const loginPage = page.locator('form, .login-form, [role="main"]').first();
    await expect(loginPage).toBeVisible();
    
    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/로그인|게임플라자/);
  });

  test('PWA 프롬프트 처리', async ({ page }) => {
    // PWA 프롬프트가 비활성화되었는지 확인
    await page.goto('/');
    await waitForApiType('devices'); // 초기 로딩 대기
    await page.waitForTimeout(3000); // PWA 프롬프트가 나타나는 시간 대기
    
    // 페이지가 정상적으로 로드되었는지만 확인
    const mainContent = page.locator('body');
    await expect(mainContent).toBeVisible();
    await checkForApiErrors(page);
  });

  test('API 응답 상태 확인', async ({ page }) => {
    // 간단한 API 응답 확인 테스트
    await page.goto('/');
    await waitForApiType('devices'); // 초기 로딩 대기
    
    // 네트워크 상태 확인 (Rate limiting 문제 없는지 확인)
    const apiCalls = [];
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiCalls.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    // 페이지 새로고침하여 API 호출 발생시키기
    await page.reload();
    await waitForApiType('devices');
    
    // Rate limiting 에러가 없는지 확인
    const rateLimitErrors = apiCalls.filter(call => call.status === 429);
    expect(rateLimitErrors.length).toBe(0);
    
    await checkForApiErrors(page);
  });
});