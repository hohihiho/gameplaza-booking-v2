/**
 * 결제 상태를 나타내는 값 객체
 */
export enum PaymentStatusType {
  PENDING = 'pending',        // 결제 대기
  COMPLETED = 'completed',    // 결제 완료
  CANCELLED = 'cancelled'     // 결제 취소
}

export class PaymentStatus {
  private constructor(
    private readonly _status: PaymentStatusType
  ) {}

  static pending(): PaymentStatus {
    return new PaymentStatus(PaymentStatusType.PENDING);
  }

  static completed(): PaymentStatus {
    return new PaymentStatus(PaymentStatusType.COMPLETED);
  }

  static cancelled(): PaymentStatus {
    return new PaymentStatus(PaymentStatusType.CANCELLED);
  }

  static fromString(status: string): PaymentStatus {
    if (!Object.values(PaymentStatusType).includes(status as PaymentStatusType)) {
      throw new Error(`Invalid payment status: ${status}`);
    }
    return new PaymentStatus(status as PaymentStatusType);
  }

  get value(): PaymentStatusType {
    return this._status;
  }

  isPending(): boolean {
    return this._status === PaymentStatusType.PENDING;
  }

  isCompleted(): boolean {
    return this._status === PaymentStatusType.COMPLETED;
  }

  isCancelled(): boolean {
    return this._status === PaymentStatusType.CANCELLED;
  }

  canTransitionTo(newStatus: PaymentStatus): boolean {
    // 취소된 상태에서는 다른 상태로 변경 불가
    if (this.isCancelled()) {
      return false;
    }

    // 완료된 상태에서는 취소만 가능
    if (this.isCompleted()) {
      return newStatus.isCancelled();
    }

    // 대기 상태에서는 완료 또는 취소로 변경 가능
    return true;
  }

  equals(other: PaymentStatus): boolean {
    return this._status === other._status;
  }

  toString(): string {
    return this._status;
  }
}