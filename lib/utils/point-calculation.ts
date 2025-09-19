/**
 * 포인트 계산 유틸리티
 *
 * 결제 금액의 1% 포인트 계산 및 검증 로직
 */

/**
 * 결제 금액으로부터 포인트를 계산합니다
 * @param paymentAmount 결제 금액 (원)
 * @returns 계산된 포인트 (결제 금액의 1%, 반올림)
 */
export function calculatePointsFromPayment(paymentAmount: number): number {
  // 입력값 검증
  if (typeof paymentAmount !== 'number' || !Number.isFinite(paymentAmount)) {
    throw new Error('유효하지 않은 결제 금액입니다');
  }

  if (paymentAmount < 0) {
    throw new Error('결제 금액은 0 이상이어야 합니다');
  }

  // 1% 계산 후 반올림
  return Math.round(paymentAmount * 0.01);
}

/**
 * 포인트 계산이 올바른지 검증합니다
 * @param paymentAmount 결제 금액
 * @param calculatedPoints 계산된 포인트
 * @returns 검증 성공 여부
 */
export function validatePointsCalculation(
  paymentAmount: number,
  calculatedPoints: number
): boolean {
  try {
    const expectedPoints = calculatePointsFromPayment(paymentAmount);
    return calculatedPoints === expectedPoints;
  } catch {
    return false;
  }
}