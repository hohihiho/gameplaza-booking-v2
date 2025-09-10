// 데이터베이스 메인 익스포트
export * from './schema';
export * from './server';
export * from './d1';

// Drizzle ORM 관련 익스포트
export { eq, and, or, not, gt, gte, lt, lte, like, between, inArray, isNull, isNotNull, sql, desc, asc } from 'drizzle-orm';

// 날짜 유틸리티 (KST 시간대 처리)
export function toKST(date: Date): Date {
  return new Date(date.getTime() + (9 * 60 * 60 * 1000));
}

export function fromKST(date: Date): Date {
  return new Date(date.getTime() - (9 * 60 * 60 * 1000));
}

// 24시간 이상 시간 포맷팅 (24~29시)
export function formatExtendedTime(hour: number, minute: number = 0): string {
  if (hour >= 24) {
    return `${hour}:${minute.toString().padStart(2, '0')}`;
  }
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

// 시간 문자열을 Date 객체로 변환 (24시간 이상 지원)
export function parseExtendedTime(timeStr: string, baseDate: Date = new Date()): Date {
  const [hour, minute] = timeStr.split(':').map(Number);
  const date = new Date(baseDate);
  
  if (hour >= 24) {
    // 익일 새벽 시간
    date.setDate(date.getDate() + 1);
    date.setHours(hour - 24, minute, 0, 0);
  } else {
    date.setHours(hour, minute, 0, 0);
  }
  
  return date;
}