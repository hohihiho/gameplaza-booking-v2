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
  const hourly<section id="rate" className="mt-16 pt-16 border-t border-gray-200">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">이용 요금</h2>
          <p className="text-xl text-gray-600">합리적인 가격으로 프리미엄 게임을 즐기세요</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200 hover:border-blue-500 transition-colors">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">기본 요금</h3>
            <div className="text-4xl font-bold text-blue-600 mb-2">₩5,000</div>
            <div className="text-gray-600 mb-6">시간당</div>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                최소 2시간부터
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                모든 게임 이용 가능
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                쾌적한 게임 환경
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-8 text-white transform scale-105">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-bold">
              BEST
            </div>
            <h3 className="text-2xl font-bold mb-4">2P 플레이</h3>
            <div className="text-4xl font-bold mb-2">₩15,000</div>
            <div className="text-blue-100 mb-6">2시간 기준</div>
            <ul className="space-y-3">
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-white mr-2" />
                마이마이 2P 전용
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-white mr-2" />
                친구와 함께 플레이
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-white mr-2" />
                더블 스코어 경쟁
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200 hover:border-blue-500 transition-colors">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">밤샘 대여</h3>
            <div className="text-4xl font-bold text-blue-600 mb-2">₩30,000</div>
            <div className="text-gray-600 mb-6">22:00 ~ 익일 06:00</div>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                8시간 무제한
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                심야 할인 적용
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                예약 필수
              </li>
            </ul>
          </div>
        </div>
      </section>Rate = originalAmount / originalDurationHours;
  
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