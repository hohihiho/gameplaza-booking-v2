/**
 * 게임플라자 예약 시스템 시간 처리 유틸리티
 * - KST 시간대 고정 처리
 * - 24시간+ 표시 체계 (0~5시를 24~29시로 표시)
 * - 모든 시간은 TEXT 형식으로 저장 ('YYYY-MM-DD HH:MM:SS')
 */

// KST 시간대 오프셋 (UTC+9)
const KST_OFFSET = 9;

/**
 * 현재 KST 시간을 반환
 * @returns KST 기준 현재 시간 ('YYYY-MM-DD HH:MM:SS' 형식)
 */
export function getCurrentKSTTime(): string {
  const now = new Date();
  const kstTime = new Date(now.getTime() + (KST_OFFSET * 60 * 60 * 1000));
  return formatToKSTString(kstTime);
}

/**
 * Date 객체를 KST 문자열로 변환
 * @param date - 변환할 Date 객체
 * @returns KST 형식 문자열 ('YYYY-MM-DD HH:MM:SS')
 */
export function formatToKSTString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * KST 문자열을 Date 객체로 변환
 * @param kstString - KST 형식 문자열 ('YYYY-MM-DD HH:MM:SS')
 * @returns Date 객체
 */
export function parseKSTString(kstString: string): Date {
  const [datePart, timePart] = kstString.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes, seconds] = timePart.split(':').map(Number);
  
  // 로컬 시간대로 Date 생성 (UTC 파싱 금지)
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

/**
 * 24시간+ 표시 체계를 일반 시간으로 변환
 * @param extendedHour - 24시간+ 형식 (0~29)
 * @returns 일반 시간 객체 { hour: 0~23, isNextDay: boolean }
 */
export function convertExtendedHour(extendedHour: number): { hour: number; isNextDay: boolean } {
  if (extendedHour >= 0 && extendedHour <= 23) {
    return { hour: extendedHour, isNextDay: false };
  } else if (extendedHour >= 24 && extendedHour <= 29) {
    return { hour: extendedHour - 24, isNextDay: true };
  } else {
    throw new Error(`유효하지 않은 확장 시간: ${extendedHour} (0~29 범위)`);
  }
}

/**
 * 일반 시간을 24시간+ 표시로 변환
 * @param hour - 일반 시간 (0~23)
 * @param isNextDay - 익일 여부
 * @returns 24시간+ 형식 (0~29)
 */
export function toExtendedHour(hour: number, isNextDay: boolean): number {
  if (hour < 0 || hour > 23) {
    throw new Error(`유효하지 않은 시간: ${hour} (0~23 범위)`);
  }
  
  if (isNextDay && hour >= 0 && hour <= 5) {
    return hour + 24; // 0~5시를 24~29시로 변환
  }
  
  return hour;
}

/**
 * 24시간+ 표시를 사용자 친화적 문자열로 변환
 * @param extendedHour - 24시간+ 형식 (0~29)
 * @returns 사용자 표시용 문자열 (예: "26시", "14시")
 */
export function formatExtendedHour(extendedHour: number): string {
  if (extendedHour < 0 || extendedHour > 29) {
    throw new Error(`유효하지 않은 확장 시간: ${extendedHour} (0~29 범위)`);
  }
  
  return `${extendedHour}시`;
}

/**
 * 시간대 범위를 사용자 친화적 문자열로 변환
 * @param startHour - 시작 시간 (24시간+ 형식)
 * @param endHour - 종료 시간 (24시간+ 형식)
 * @returns 사용자 표시용 문자열 (예: "24시~29시")
 */
export function formatTimeSlotRange(startHour: number, endHour: number): string {
  return `${formatExtendedHour(startHour)}~${formatExtendedHour(endHour)}`;
}

/**
 * 예약 날짜와 시간대를 실제 Date 객체로 변환
 * @param reservationDate - 예약 날짜 ('YYYY-MM-DD' 형식)
 * @param extendedHour - 24시간+ 형식 시간
 * @returns 실제 Date 객체
 */
export function createReservationDateTime(reservationDate: string, extendedHour: number): Date {
  const [year, month, day] = reservationDate.split('-').map(Number);
  const { hour, isNextDay } = convertExtendedHour(extendedHour);
  
  const targetDate = new Date(year, month - 1, day, hour, 0, 0);
  
  if (isNextDay) {
    targetDate.setDate(targetDate.getDate() + 1);
  }
  
  return targetDate;
}

/**
 * 시간대가 현재 시간보다 미래인지 확인
 * @param reservationDate - 예약 날짜 ('YYYY-MM-DD' 형식)
 * @param extendedHour - 24시간+ 형식 시간
 * @returns 미래 시간인지 여부
 */
export function isTimeSlotFuture(reservationDate: string, extendedHour: number): boolean {
  const reservationTime = createReservationDateTime(reservationDate, extendedHour);
  const now = new Date();
  
  return reservationTime.getTime() > now.getTime();
}

/**
 * 두 시간대가 겹치는지 확인
 * @param startHour1 - 첫 번째 시간대 시작
 * @param endHour1 - 첫 번째 시간대 종료
 * @param startHour2 - 두 번째 시간대 시작
 * @param endHour2 - 두 번째 시간대 종료
 * @returns 겹치는지 여부
 */
export function isTimeSlotOverlapping(
  startHour1: number, 
  endHour1: number, 
  startHour2: number, 
  endHour2: number
): boolean {
  return startHour1 < endHour2 && startHour2 < endHour1;
}

/**
 * 예약 시간이 체크인 가능한 시간인지 확인
 * @param reservationDate - 예약 날짜
 * @param startHour - 시작 시간 (24시간+ 형식)
 * @param checkInMinutesBefore - 체크인 가능 시간 (분, 기본 15분)
 * @returns 체크인 가능 여부
 */
export function isCheckInAvailable(
  reservationDate: string, 
  startHour: number,
  checkInMinutesBefore: number = 15
): boolean {
  const reservationTime = createReservationDateTime(reservationDate, startHour);
  const checkInStartTime = new Date(reservationTime.getTime() - (checkInMinutesBefore * 60 * 1000));
  const now = new Date();
  
  return now >= checkInStartTime && now <= reservationTime;
}

/**
 * 대여 시간이 만료되었는지 확인
 * @param reservationDate - 예약 날짜
 * @param endHour - 종료 시간 (24시간+ 형식)
 * @param extendedMinutes - 연장 시간 (분, 기본 0)
 * @returns 만료 여부
 */
export function isRentalExpired(
  reservationDate: string,
  endHour: number,
  extendedMinutes: number = 0
): boolean {
  const endTime = createReservationDateTime(reservationDate, endHour);
  const actualEndTime = new Date(endTime.getTime() + (extendedMinutes * 60 * 1000));
  const now = new Date();
  
  return now > actualEndTime;
}

/**
 * 현재 날짜를 'YYYY-MM-DD' 형식으로 반환
 * @returns 현재 날짜 문자열
 */
export function getCurrentDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * 날짜 문자열에 일수를 더함
 * @param dateString - 기준 날짜 ('YYYY-MM-DD' 형식)
 * @param days - 더할 일수
 * @returns 새로운 날짜 문자열
 */
export function addDaysToDateString(dateString: string, days: number): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  
  const newYear = date.getFullYear();
  const newMonth = String(date.getMonth() + 1).padStart(2, '0');
  const newDay = String(date.getDate()).padStart(2, '0');
  
  return `${newYear}-${newMonth}-${newDay}`;
}

/**
 * 예약 시간까지 남은 시간을 분 단위로 계산
 * @param reservationDate - 예약 날짜
 * @param startHour - 시작 시간 (24시간+ 형식)
 * @returns 남은 시간 (분), 음수이면 이미 지남
 */
export function getMinutesUntilReservation(reservationDate: string, startHour: number): number {
  const reservationTime = createReservationDateTime(reservationDate, startHour);
  const now = new Date();
  
  return Math.floor((reservationTime.getTime() - now.getTime()) / (1000 * 60));
}

// =============================================================================
// 기존 호환성 함수들 (기존 코드와의 호환성을 위해 유지)
// =============================================================================

/**
 * 0시~5시를 24시~29시로 변환
 */
export function formatTime24Plus(time: string): string {
  if (!time || typeof time !== 'string') return time as any
  
  const match = time.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return time
  
  const hour = parseInt(match[1])
  const minute = match[2]
  
  if (hour >= 0 && hour <= 5) {
    return `${hour + 24}:${minute}`
  }
  
  return time
}

/**
 * 24시~29시를 0시~5시로 변환
 */
export function parseTime24Plus(time: string): string {
  if (!time || typeof time !== 'string') return time
  
  const match = time.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return time
  
  const hour = parseInt(match[1])
  const minute = match[2]
  
  if (hour >= 24 && hour <= 29) {
    return `${(hour - 24).toString().padStart(2, '0')}:${minute}`
  }
  
  return time
}

/**
 * 시간 범위가 유효한지 검증
 */
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return false
  
  const startMatch = startTime.match(/^(\d{1,2}):(\d{2})$/)
  const endMatch = endTime.match(/^(\d{1,2}):(\d{2})$/)
  
  if (!startMatch || !endMatch) return false
  
  const startHour = parseInt(startMatch[1])
  const startMinute = parseInt(startMatch[2])
  const endHour = parseInt(endMatch[1])
  const endMinute = parseInt(endMatch[2])
  
  // 시간 범위 검증
  if (startHour < 0 || startHour > 29 || endHour < 0 || endHour > 29) {
    return false
  }
  
  if (startMinute < 0 || startMinute > 59 || endMinute < 0 || endMinute > 59) {
    return false
  }
  
  // 시작 시간을 분으로 변환
  let startTotalMinutes = startHour * 60 + startMinute
  let endTotalMinutes = endHour * 60 + endMinute
  
  // 24시간을 넘는 경우 조정
  if (startHour >= 24) {
    startTotalMinutes = (startHour - 24) * 60 + startMinute + 24 * 60
  }
  if (endHour >= 24) {
    endTotalMinutes = (endHour - 24) * 60 + endMinute + 24 * 60
  }
  
  // 종료 시간이 시작 시간보다 이전인 경우 (밤샘 예약)
  if (endTotalMinutes <= startTotalMinutes) {
    // 다음날로 넘어가는 경우 처리
    endTotalMinutes += 24 * 60
  }
  
  // 24시간 초과 검증
  const duration = endTotalMinutes - startTotalMinutes
  if (duration > 24 * 60 || duration <= 0) {
    return false
  }
  
  return true
}

/**
 * 시간 차이를 시간 단위로 계산
 */
export function calculateDuration(startTime: string, endTime: string): number {
  if (!isValidTimeRange(startTime, endTime)) {
    return 0
  }
  
  const startMatch = startTime.match(/^(\d{1,2}):(\d{2})$/)!
  const endMatch = endTime.match(/^(\d{1,2}):(\d{2})$/)!
  
  const startHour = parseInt(startMatch[1])
  const startMinute = parseInt(startMatch[2])
  const endHour = parseInt(endMatch[1])
  const endMinute = parseInt(endMatch[2])
  
  let startTotalMinutes = startHour * 60 + startMinute
  let endTotalMinutes = endHour * 60 + endMinute
  
  // 24시간을 넘는 경우 조정
  if (startHour >= 24) {
    startTotalMinutes = (startHour - 24) * 60 + startMinute + 24 * 60
  }
  if (endHour >= 24) {
    endTotalMinutes = (endHour - 24) * 60 + endMinute + 24 * 60
  }
  
  // 종료 시간이 시작 시간보다 이전인 경우 (다음날로 넘어가는 경우)
  if (endTotalMinutes <= startTotalMinutes) {
    endTotalMinutes += 24 * 60
  }
  
  return (endTotalMinutes - startTotalMinutes) / 60
}

/**
 * 시간 문자열을 24시간+ 형식으로 파싱
 * @param timeString - 시간 문자열 (예: "26시", "14:00", "2시")
 * @returns 24시간+ 형식 숫자
 */
export function parseExtendedHourString(timeString: string): number {
  // "26시" 형식
  if (timeString.endsWith('시')) {
    const hour = parseInt(timeString.replace('시', ''));
    if (hour >= 0 && hour <= 29) {
      return hour;
    }
  }
  
  // "14:00" 형식
  if (timeString.includes(':')) {
    const hour = parseInt(timeString.split(':')[0]);
    if (hour >= 0 && hour <= 23) {
      return hour;
    }
  }
  
  throw new Error(`유효하지 않은 시간 형식: ${timeString}`);
}

/**
 * 디버깅용 시간 정보 출력
 * @param label - 라벨
 * @param reservationDate - 예약 날짜
 * @param extendedHour - 24시간+ 형식 시간
 */
export function debugTimeInfo(label: string, reservationDate: string, extendedHour: number): void {
  const actualTime = createReservationDateTime(reservationDate, extendedHour);
  const { hour, isNextDay } = convertExtendedHour(extendedHour);
  
  console.log(`[${label}]`, {
    reservationDate,
    extendedHour: formatExtendedHour(extendedHour),
    actualHour: hour,
    isNextDay,
    actualDateTime: formatToKSTString(actualTime),
    timestamp: actualTime.getTime()
  });
}

// 상수들
export const TIME_CONSTANTS = {
  // 24시간+ 범위
  EXTENDED_HOUR_MIN: 0,
  EXTENDED_HOUR_MAX: 29,
  
  // 밤샘 시간대 (24~29시)
  OVERNIGHT_START: 24,
  OVERNIGHT_END: 29,
  
  // 일반 시간대 (7~23시)
  NORMAL_START: 7,
  NORMAL_END: 23,
  
  // 체크인 가능 시간 (분)
  DEFAULT_CHECKIN_BEFORE_MINUTES: 15,
  
  // 노쇼 처리 대기 시간 (분)
  NO_SHOW_WAIT_MINUTES: 30,
} as const;
