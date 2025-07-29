/**
 * 클라이언트 사이드에서 사용하는 시간 유틸리티
 * 개발 환경에서 시간 모킹을 지원합니다.
 */

/**
 * 현재 시간을 가져옵니다. (모킹 지원)
 */
export function getClientNow(): Date {
  // 브라우저 환경에서만 작동
  if (typeof window === 'undefined') {
    return new Date();
  }

  // 로컬 스토리지에서 모킹된 날짜 확인
  const mockDateStr = localStorage.getItem('MOCK_DATE');
  if (mockDateStr) {
    return new Date(mockDateStr);
  }

  return new Date();
}

/**
 * 날짜가 오늘인지 확인 (모킹 지원)
 */
export function isToday(date: Date): boolean {
  const now = getClientNow();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/**
 * 날짜가 내일인지 확인 (모킹 지원)
 */
export function isTomorrow(date: Date): boolean {
  const now = getClientNow();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return (
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate()
  );
}

/**
 * 현재 시간으로부터 N일 후의 날짜 계산 (모킹 지원)
 */
export function addDaysFromNow(days: number): Date {
  const now = getClientNow();
  const result = new Date(now);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 24시간 이내인지 확인 (모킹 지원)
 */
export function isWithin24Hours(date: Date): boolean {
  const now = getClientNow();
  const diff = date.getTime() - now.getTime();
  return diff > 0 && diff <= 24 * 60 * 60 * 1000;
}