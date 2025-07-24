/**
 * 결제 금액 값 객체
 */
export class PaymentAmount {
  private static readonly MIN_AMOUNT = 0
  private static readonly MAX_AMOUNT = 10000000 // 천만원

  constructor(private readonly value: number) {
    this.validate()
  }

  private validate(): void {
    if (!Number.isInteger(this.value)) {
      throw new Error('결제 금액은 정수여야 합니다')
    }

    if (this.value < PaymentAmount.MIN_AMOUNT) {
      throw new Error('결제 금액은 0원 이상이어야 합니다')
    }

    if (this.value > PaymentAmount.MAX_AMOUNT) {
      throw new Error(`결제 금액은 ${PaymentAmount.MAX_AMOUNT.toLocaleString()}원을 초과할 수 없습니다`)
    }
  }

  /**
   * 금액 값 반환
   */
  getValue(): number {
    return this.value
  }

  /**
   * 두 금액을 더함
   */
  add(other: PaymentAmount): PaymentAmount {
    return new PaymentAmount(this.value + other.value)
  }

  /**
   * 두 금액을 뺌
   */
  subtract(other: PaymentAmount): PaymentAmount {
    return new PaymentAmount(this.value - other.value)
  }

  /**
   * 퍼센트 계산
   */
  percentage(percent: number): PaymentAmount {
    if (percent < 0 || percent > 100) {
      throw new Error('퍼센트는 0에서 100 사이여야 합니다')
    }
    const amount = Math.floor(this.value * (percent / 100))
    return new PaymentAmount(amount)
  }

  /**
   * 할인 적용
   */
  applyDiscount(discountAmount: PaymentAmount): PaymentAmount {
    const discounted = this.value - discountAmount.value
    return new PaymentAmount(Math.max(0, discounted))
  }

  /**
   * 부가세 계산 (10%)
   */
  calculateVAT(): PaymentAmount {
    const vat = Math.floor(this.value / 11) // 부가세 포함 금액에서 부가세 추출
    return new PaymentAmount(vat)
  }

  /**
   * 공급가액 계산
   */
  calculateSupplyValue(): PaymentAmount {
    const vat = this.calculateVAT()
    return this.subtract(vat)
  }

  /**
   * 두 금액이 같은지 비교
   */
  equals(other: PaymentAmount): boolean {
    return this.value === other.value
  }

  /**
   * 금액이 더 큰지 비교
   */
  isGreaterThan(other: PaymentAmount): boolean {
    return this.value > other.value
  }

  /**
   * 금액이 더 작은지 비교
   */
  isLessThan(other: PaymentAmount): boolean {
    return this.value < other.value
  }

  /**
   * 금액이 0인지 확인
   */
  isZero(): boolean {
    return this.value === 0
  }

  /**
   * 포맷팅된 문자열 반환
   */
  format(): string {
    return `${this.value.toLocaleString('ko-KR')}원`
  }

  /**
   * 숫자로 변환
   */
  toNumber(): number {
    return this.value
  }

  /**
   * 0원 생성
   */
  static zero(): PaymentAmount {
    return new PaymentAmount(0)
  }

  /**
   * 금액 생성
   */
  static of(amount: number): PaymentAmount {
    return new PaymentAmount(amount)
  }
}