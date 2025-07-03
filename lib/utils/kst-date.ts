/**
 * KST(한국 표준시) 기준 날짜 처리 유틸리티
 * 
 * 이 프로젝트는 한국 오락실에서만 사용되므로 
 * 모든 날짜/시간 처리는 KST 기준으로 처리합니다.
 */

/**
 * YYYY-MM-DD 형식의 날짜 문자열을 KST 기준 Date 객체로 변환
 * ISO 8601 형식(2025-06-30T10:29:06.342+00)도 처리 가능
 * @param dateString - YYYY-MM-DD 또는 ISO 8601 형식의 날짜 문자열
 * @returns KST 기준으로 파싱된 Date 객체
 */
export function parseKSTDate(dateString: string): Date {
  // ISO 8601 형식인 경우 (T 포함)
  if (dateString.includes('T')) {
    return new Date(dateString);
  }
  
  // YYYY-MM-DD 형식인 경우
  const parts = dateString.split('-').map(Number);
  const year = parts[0] || 0;
  const month = parts[1] || 1;
  const day = parts[2] || 1;
  return new Date(year, month - 1, day);
}

/**
 * Date 객체를 YYYY-MM-DD 형식의 문자열로 변환
 * @param date - Date 객체
 * @returns YYYY-MM-DD 형식의 문자열
 */
export function formatKSTDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * YYYY-MM-DD 문자열과 HH:MM 시간을 결합하여 KST Date 객체 생성
 * @param dateString - YYYY-MM-DD 형식의 날짜 문자열
 * @param timeString - HH:MM 형식의 시간 문자열
 * @returns KST 기준으로 생성된 Date 객체
 */
export function createKSTDateTime(dateString: string, timeString: string): Date {
  const dateParts = dateString.split('-').map(Number);
  const year = dateParts[0] || 0;
  const month = dateParts[1] || 1;
  let day = dateParts[2] || 1;
  
  const timeParts = timeString.split(':').map(Number);
  const hour = timeParts[0] || 0;
  const minute = timeParts[1] || 0;
  
  // 0~5시는 익일로 처리 (밤샘 시간대)
  if (hour >= 0 && hour <= 5) {
    day += 1;
  }
  
  return new Date(year, month - 1, day, hour, minute, 0);
}

/**
 * 24시간 이내인지 확인
 * @param targetDate - 확인할 Date 객체
 * @returns 24시간 이내면 true
 */
export function isWithin24Hours(targetDate: Date): boolean {
  const now = new Date();
  const hoursDiff = (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursDiff < 24;
}

/**
 * 한국어 날짜 표시 형식으로 변환
 * @param date - Date 객체
 * @returns "M월 D일 요일" 형식의 문자열
 */
export function formatKoreanDate(date: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${days[date.getDay()]}요일`;
}

/**
 * KST 기준 현재 시간 문자열
 * @returns "YYYY-MM-DD HH:MM:SS" 형식의 현재 시간
 */
export function getCurrentKSTString(): string {
  const now = new Date();
  return now.toLocaleString('ko-KR', { 
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * 시간 표시 형식 변환 (0~5시는 24~29시로 표시)
 * @param timeString - HH:MM 또는 HH:MM:SS 형식의 시간 문자열
 * @returns "X시" 형식의 문자열
 */
export function formatTimeKST(timeString: string): string {
  const [hour] = timeString.split(':');
  if (!hour) return '';
  const h = parseInt(hour);
  // 0~5시는 24~29시로 표시
  if (h >= 0 && h <= 5) {
    return `${h + 24}시`;
  }
  return `${h}시`;
}