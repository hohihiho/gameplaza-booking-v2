/**
 * 결제 방법을 나타내는 값 객체
 */
export enum PaymentMethodType {
  CASH = 'cash',              // 현금
  BANK_TRANSFER = 'transfer', // 계좌이체
  CARD = 'card'              // 카드 (향후 추가)
}

export class PaymentMethod {
  private constructor(
    private readonly _method: PaymentMethodType
  ) {}

  static cash(): PaymentMethod {
    return new PaymentMethod(PaymentMethodType.CASH);
  }

  static bankTransfer(): PaymentMethod {
    return new PaymentMethod(PaymentMethodType.BANK_TRANSFER);
  }

  static card(): PaymentMethod {
    return new PaymentMethod(PaymentMethodType.CARD);
  }

  static fromString(method: string): PaymentMethod {
    if (!Object.values(PaymentMethodType).includes(method as PaymentMethodType)) {
      throw new Error(`Invalid payment method: ${method}`);
    }
    return new PaymentMethod(method as PaymentMethodType);
  }

  get value(): PaymentMethodType {
    return this._method;
  }

  isCash(): boolean {
    return this._method === PaymentMethodType.CASH;
  }

  isBankTransfer(): boolean {
    return this._method === PaymentMethodType.BANK_TRANSFER;
  }

  isCard(): boolean {
    return this._method === PaymentMethodType.CARD;
  }

  /**
   * 즉시 확인 가능한 결제 방법인지 확인
   * 현금은 즉시 확인 가능, 계좌이체는 확인 필요
   */
  isInstantPayment(): boolean {
    return this.isCash();
  }

  equals(other: PaymentMethod): boolean {
    return this._method === other._method;
  }

  toString(): string {
    return this._method;
  }

  /**
   * 사용자 친화적인 이름 반환
   */
  getDisplayName(): string {
    switch (this._method) {
      case PaymentMethodType.CASH:
        return '현금';
      case PaymentMethodType.BANK_TRANSFER:
        return '계좌이체';
      case PaymentMethodType.CARD:
        return '카드';
      default:
        return this._method;
    }
  }
}