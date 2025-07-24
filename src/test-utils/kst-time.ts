/**
 * KST 시간 관련 테스트 유틸리티
 * 24시간 표시 체계 (0~5시를 24~29시로 표시)를 테스트하기 위한 헬퍼 함수들
 */

export function createKSTDate(year: number, month: number, date: number, hours: number, minutes: number = 0): Date {
  return new Date(year, month - 1, date, hours, minutes, 0, 0)
}

export function formatTestTime(hours: number): string {
  if (hours >= 0 && hours < 6) {
    return `${24 + hours}시`
  }
  return `${hours}시`
}

export const KST_TEST_CASES = {
  midnight: createKSTDate(2025, 7, 23, 0),      // 24시
  oneAM: createKSTDate(2025, 7, 23, 1),         // 25시
  twoAM: createKSTDate(2025, 7, 23, 2),         // 26시
  threeAM: createKSTDate(2025, 7, 23, 3),       // 27시
  fourAM: createKSTDate(2025, 7, 23, 4),         // 28시
  fiveAM: createKSTDate(2025, 7, 23, 5),         // 29시
  sixAM: createKSTDate(2025, 7, 23, 6),          // 6시 (리셋 시간)
  noon: createKSTDate(2025, 7, 23, 12),          // 12시
  evening: createKSTDate(2025, 7, 23, 18),       // 18시
  lateNight: createKSTDate(2025, 7, 23, 23),     // 23시
}

export const TIME_SLOT_TEST_CASES = [
  { slot: '10:00-12:00', display: '10시-12시' },
  { slot: '14:00-16:00', display: '14시-16시' },
  { slot: '22:00-24:00', display: '22시-24시' },
  { slot: '24:00-26:00', display: '24시-26시' }, // 자정 넘어서
  { slot: '26:00-28:00', display: '26시-28시' }, // 새벽 2-4시
  { slot: '28:00-29:00', display: '28시-29시' }, // 새벽 4-5시
]

export function isWithin24Hours(targetDate: Date, currentDate: Date = new Date()): boolean {
  const diff = targetDate.getTime() - currentDate.getTime()
  const hoursDiff = diff / (1000 * 60 * 60)
  return hoursDiff >= 24
}