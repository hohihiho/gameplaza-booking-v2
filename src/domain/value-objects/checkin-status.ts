/**
 * 체크인 상태를 나타내는 값 객체
 */
export enum CheckInStatusType {
  CHECKED_IN = 'checked_in',  // 체크인 완료
  IN_USE = 'in_use',         // 사용 중
  COMPLETED = 'completed',    // 완료
  CANCELLED = 'cancelled'     // 취소
}

export class CheckInStatus {
  private constructor(
    private readonly _status: CheckInStatusType
  ) {}

  static checkedIn(): CheckInStatus {
    return new CheckInStatus(CheckInStatusType.CHECKED_IN);
  }

  static inUse(): CheckInStatus {
    return new CheckInStatus(CheckInStatusType.IN_USE);
  }

  static completed(): CheckInStatus {
    return new CheckInStatus(CheckInStatusType.COMPLETED);
  }

  static cancelled(): CheckInStatus {
    return new CheckInStatus(CheckInStatusType.CANCELLED);
  }

  static fromString(status: string): CheckInStatus {
    if (!Object.values(CheckInStatusType).includes(status as CheckInStatusType)) {
      throw new Error(`Invalid check-in status: ${status}`);
    }
    return new CheckInStatus(status as CheckInStatusType);
  }

  get value(): CheckInStatusType {
    return this._status;
  }

  isCheckedIn(): boolean {
    return this._status === CheckInStatusType.CHECKED_IN;
  }

  isInUse(): boolean {
    return this._status === CheckInStatusType.IN_USE;
  }

  isCompleted(): boolean {
    return this._status === CheckInStatusType.COMPLETED;
  }

  isCancelled(): boolean {
    return this._status === CheckInStatusType.CANCELLED;
  }

  isActive(): boolean {
    return this.isCheckedIn() || this.isInUse();
  }

  canTransitionTo(newStatus: CheckInStatus): boolean {
    // 취소되거나 완료된 상태에서는 다른 상태로 변경 불가
    if (this.isCancelled() || this.isCompleted()) {
      return false;
    }

    // 체크인 상태에서는 사용중, 완료, 취소로 변경 가능
    if (this.isCheckedIn()) {
      return true;
    }

    // 사용중 상태에서는 완료 또는 취소로만 변경 가능
    if (this.isInUse()) {
      return newStatus.isCompleted() || newStatus.isCancelled();
    }

    return false;
  }

  equals(other: CheckInStatus): boolean {
    return this._status === other._status;
  }

  toString(): string {
    return this._status;
  }

  /**
   * 사용자 친화적인 상태명 반환
   */
  getDisplayName(): string {
    switch (this._status) {
      case CheckInStatusType.CHECKED_IN:
        return '체크인';
      case CheckInStatusType.IN_USE:
        return '사용중';
      case CheckInStatusType.COMPLETED:
        return '완료';
      case CheckInStatusType.CANCELLED:
        return '취소';
      default:
        return this._status;
    }
  }

  /**
   * 상태별 색상 코드 반환
   */
  getColorCode(): string {
    switch (this._status) {
      case CheckInStatusType.CHECKED_IN:
        return '#FCD34D'; // 노란색
      case CheckInStatusType.IN_USE:
        return '#3B82F6'; // 파란색
      case CheckInStatusType.COMPLETED:
        return '#6B7280'; // 회색
      case CheckInStatusType.CANCELLED:
        return '#EF4444'; // 빨간색
      default:
        return '#6B7280';
    }
  }
}