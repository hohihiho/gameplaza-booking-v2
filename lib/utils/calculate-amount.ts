// 실제 이용시간 기준 금액 계산 유틸리티
// 비전공자 설명: 실제 이용한 시간을 기준으로 요금을 계산하는 함수입니다

export interface TimeAdjustmentCalculation {
  originalAmount: number;
  adjustedAmount: number;
  actualDurationMinutes: number;
  actualDurationHours: number;
  hourlyRate: number;
  difference: number;
  percentageChange: number;
}

/**
 * 실제 이용시간 기준으로 조정된 금액을 계산합니다
 * @param startTime - 실제 시작 시간
 * @param endTime - 실제 종료 시간
 * @param originalAmount - 원래 예약 금액
 * @param originalDurationHours - 원래 예약 시간 (시간 단위)
 * @returns 계산된 금액 정보
 */
export function calculateAdjustedAmount(
  startTime: Date | string,
  endTime: Date | string,
  originalAmount: number,
  originalDurationHours: number = 2
): TimeAdjustmentCalculation {
  // Date 객체로 변환
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  
  // 실제 이용 시간 계산 (분 단위)
  const actualDurationMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  
  // 시간 단위로 변환 (올림 처리 - 분 단위는 올림)
  const actualDurationHours = Math.ceil(actualDurationMinutes / 60);
  
  // 시간당 요금 계산
  const hourlyRate = originalAmount / originalDurationHours;
  
  // 조정된 금액 계산
  const adjustedAmount = hourlyRate * actualDurationHours;
  
  // 차액 계산
  const difference = adjustedAmount - originalAmount;
  
  // 변동률 계산 (%)
  const percentageChange = ((adjustedAmount - originalAmount) / originalAmount) * 100;
  
  return {
    originalAmount,
    adjustedAmount,
    actualDurationMinutes,
    actualDurationHours,
    hourlyRate,
    difference,
    percentageChange
  };
}

/**
 * 시간을 포맷팅합니다 (HH:mm 형식)
 * @param date - 포맷팅할 날짜/시간
 * @returns 포맷팅된 시간 문자열
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toTimeString().slice(0, 5);
}

/**
 * 두 시간의 차이를 계산하여 읽기 쉬운 형태로 반환합니다
 * @param startTime - 시작 시간
 * @param endTime - 종료 시간
 * @returns "X시간 Y분" 형태의 문자열
 */
export function formatDuration(startTime: Date | string, endTime: Date | string): string {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  
  const diffMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  
  if (hours === 0) {
    return `${minutes}분`;
  } else if (minutes === 0) {
    return `${hours}시간`;
  } else {
    return `${hours}시간 ${minutes}분`;
  }
}

/**
 * 조정 사유를 한글로 변환합니다
 * @param reason - 조정 사유 코드
 * @returns 한글 조정 사유
 */
export function getReasonText(reason: string): string {
  const reasonMap: Record<string, string> = {
    'admin_late': '관리자 지각',
    'system_error': '시스템 오류',
    'customer_extend': '고객 요청 연장',
    'early_finish': '조기 종료',
    'other': '기타'
  };
  
  return reasonMap[reason] || reason;
}