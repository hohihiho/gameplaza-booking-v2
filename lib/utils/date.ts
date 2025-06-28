// 날짜/시간 관련 유틸리티 함수

/**
 * 현재 KST 시간을 ISO 문자열로 반환
 */
export function getKSTNow(): string {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kstTime = new Date(utc + (9 * 60 * 60 * 1000));
  return kstTime.toISOString();
}

/**
 * UTC 시간을 KST로 변환
 */
export function utcToKST(utcDate: Date | string): Date {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (9 * 60 * 60 * 1000));
}

/**
 * KST 시간을 UTC로 변환
 */
export function kstToUTC(kstDate: Date | string): Date {
  const date = typeof kstDate === 'string' ? new Date(kstDate) : kstDate;
  const utc = date.getTime() - (9 * 60 * 60 * 1000);
  return new Date(utc);
}

/**
 * 날짜를 한국 형식으로 포맷팅
 */
export function formatKSTDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const kstDate = typeof date === 'string' ? utcToKST(date) : utcToKST(date);
  return kstDate.toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    ...options
  });
}

/**
 * 시간을 한국 형식으로 포맷팅
 */
export function formatKSTTime(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const kstDate = typeof date === 'string' ? utcToKST(date) : utcToKST(date);
  return kstDate.toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul',
    ...options
  });
}

/**
 * 날짜와 시간을 한국 형식으로 포맷팅
 */
export function formatKSTDateTime(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const kstDate = typeof date === 'string' ? utcToKST(date) : utcToKST(date);
  return kstDate.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    ...options
  });
}

/**
 * 오늘 날짜를 KST 기준 YYYY-MM-DD 형식으로 반환
 */
export function getTodayKST(): string {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kstTime = new Date(utc + (9 * 60 * 60 * 1000));
  const dateParts = kstTime.toISOString().split('T');
  return dateParts[0] || '';
}

/**
 * 주어진 날짜가 오늘인지 확인 (KST 기준)
 */
export function isToday(date: Date | string): boolean {
  const today = getTodayKST();
  if (typeof date === 'string') {
    return today === date.split('T')[0];
  } else {
    const kstDate = utcToKST(date).toISOString().split('T');
    return today === (kstDate[0] || '');
  }
}

/**
 * 시간 문자열을 12시간 형식으로 변환
 */
export function formatTime12Hour(timeString: string): string {
  const timeParts = timeString.split(':');
  const hours = timeParts[0] || '0';
  const minutes = timeParts[1] || '00';
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? '오후' : '오전';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${ampm} ${displayHour}:${minutes}`;
}

/**
 * 두 날짜 사이의 일수 차이 계산
 */
export function getDaysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}