/**
 * API 테스트를 위한 헬퍼 함수들
 * Rate limiting 문제를 방지하기 위한 유틸리티
 */

import { Page, expect } from '@playwright/test';

/**
 * API 호출 간 대기시간 (Rate limiting 방지)
 */
export const API_CALL_DELAY = 1000; // 1초

/**
 * 테스트 간 대기시간 (Rate limiting 방지)
 */
export const TEST_CASE_DELAY = 2000; // 2초

/**
 * API 호출 전 대기
 */
export async function waitBeforeApiCall(delay: number = API_CALL_DELAY): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * 테스트 케이스 간 대기
 */
export async function waitBetweenTests(delay: number = TEST_CASE_DELAY): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * API 응답을 안전하게 기다리기
 */
export async function waitForApiResponse(
  page: Page, 
  url: string, 
  options: { timeout?: number; status?: number } = {}
): Promise<void> {
  const { timeout = 10000, status = 200 } = options;
  
  await page.waitForResponse(
    response => response.url().includes(url) && response.status() === status,
    { timeout }
  );
  
  // 추가 대기시간으로 Rate limiting 방지
  await waitBeforeApiCall();
}

/**
 * 여러 API 호출을 순차적으로 실행
 */
export async function sequentialApiCalls<T>(
  calls: (() => Promise<T>)[],
  delay: number = API_CALL_DELAY
): Promise<T[]> {
  const results: T[] = [];
  
  for (const call of calls) {
    const result = await call();
    results.push(result);
    
    // 마지막 호출이 아니면 대기
    if (call !== calls[calls.length - 1]) {
      await waitBeforeApiCall(delay);
    }
  }
  
  return results;
}

/**
 * Rate limiting 에러 발생 시 재시도
 */
export async function retryOnRateLimit<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (
        attempt < maxRetries && 
        (error as any)?.status === 429
      ) {
        // 지수 백오프로 대기시간 증가
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  
  throw new Error(`Operation failed after ${maxRetries} attempts`);
}

/**
 * 페이지에서 API 에러 확인
 */
export async function checkForApiErrors(page: Page): Promise<void> {
  // 429 에러 메시지 확인
  const rateLimitError = page.locator('text=너무 많은 요청');
  if (await rateLimitError.isVisible()) {
    throw new Error('Rate limit error detected on page');
  }
  
  // 일반적인 API 에러 확인
  const apiError = page.locator('[data-testid="api-error"]');
  if (await apiError.isVisible()) {
    const errorText = await apiError.textContent();
    throw new Error(`API error detected: ${errorText}`);
  }
}

/**
 * 네트워크 요청 모니터링 시작
 */
export function startNetworkMonitoring(page: Page): {
  getFailedRequests: () => { url: string; status: number }[];
  getRateLimitedRequests: () => { url: string; status: number }[];
} {
  const failedRequests: { url: string; status: number }[] = [];
  const rateLimitedRequests: { url: string; status: number }[] = [];
  
  page.on('response', response => {
    if (response.status() >= 400) {
      failedRequests.push({
        url: response.url(),
        status: response.status()
      });
      
      if (response.status() === 429) {
        rateLimitedRequests.push({
          url: response.url(),
          status: response.status()
        });
      }
    }
  });
  
  return {
    getFailedRequests: () => failedRequests,
    getRateLimitedRequests: () => rateLimitedRequests
  };
}

/**
 * 테스트 환경 헤더 설정
 */
export async function setTestEnvironmentHeaders(page: Page): Promise<void> {
  await page.setExtraHTTPHeaders({
    'X-Test-Environment': 'true',
    'X-Test-Session': `test-${Date.now()}`,
  });
}

/**
 * API 엔드포인트별 최적 대기시간
 */
export const API_DELAYS = {
  auth: 1500,        // 인증 API
  reservations: 2000, // 예약 API
  devices: 1000,     // 기기 API
  timeslots: 1000,   // 시간슬롯 API
  checkins: 1500,    // 체크인 API
  admin: 1000,       // 관리자 API
} as const;

/**
 * 특정 API 타입에 맞는 대기시간 적용
 */
export async function waitForApiType(apiType: keyof typeof API_DELAYS): Promise<void> {
  await waitBeforeApiCall(API_DELAYS[apiType]);
}