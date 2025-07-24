import { PaymentStatus, PaymentStatusType } from '../value-objects/payment-status';
import { PaymentMethod, PaymentMethodType } from '../value-objects/payment-method';
import { CheckInStatus, CheckInStatusType } from '../value-objects/checkin-status';
import { CheckInTime } from '../value-objects/checkin-time';

export interface CheckInProps {
  id: string;
  reservationId: string;
  deviceId: string;
  checkInTime: Date;
  checkOutTime?: Date;
  paymentStatus: PaymentStatusType;
  paymentMethod?: PaymentMethodType;
  paymentAmount: number;
  adjustedAmount?: number;
  adjustmentReason?: string;
  actualStartTime?: Date;
  actualEndTime?: Date;
  status: CheckInStatusType;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 체크인 엔티티
 * 예약된 고객의 실제 방문과 이용을 관리
 */
export class CheckIn {
  private readonly _id: string;
  private readonly _reservationId: string;
  private readonly _deviceId: string;
  private readonly _checkInTime: Date;
  private _checkOutTime?: Date;
  private _paymentStatus: PaymentStatus;
  private _paymentMethod?: PaymentMethod;
  private readonly _paymentAmount: number;
  private _adjustedAmount?: number;
  private _adjustmentReason?: string;
  private _actualStartTime?: Date;
  private _actualEndTime?: Date;
  private _status: CheckInStatus;
  private _notes?: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: CheckInProps) {
    this._id = props.id;
    this._reservationId = props.reservationId;
    this._deviceId = props.deviceId;
    this._checkInTime = props.checkInTime;
    this._checkOutTime = props.checkOutTime;
    this._paymentStatus = PaymentStatus.fromString(props.paymentStatus);
    this._paymentMethod = props.paymentMethod ? PaymentMethod.fromString(props.paymentMethod) : undefined;
    this._paymentAmount = props.paymentAmount;
    this._adjustedAmount = props.adjustedAmount;
    this._adjustmentReason = props.adjustmentReason;
    this._actualStartTime = props.actualStartTime;
    this._actualEndTime = props.actualEndTime;
    this._status = CheckInStatus.fromString(props.status);
    this._notes = props.notes;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  /**
   * 새로운 체크인 생성
   */
  static create(props: {
    reservationId: string;
    deviceId: string;
    paymentAmount: number;
    reservationStartTime: Date;
  }): CheckIn {
    const now = new Date();
    const checkInTime = new CheckInTime(props.reservationStartTime);
    
    if (!checkInTime.canCheckIn(now)) {
      throw new Error(checkInTime.getCheckInStatusMessage(now));
    }

    return new CheckIn({
      id: `checkin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      reservationId: props.reservationId,
      deviceId: props.deviceId,
      checkInTime: now,
      paymentStatus: PaymentStatusType.PENDING,
      paymentAmount: props.paymentAmount,
      status: CheckInStatusType.CHECKED_IN,
      createdAt: now,
      updatedAt: now
    });
  }

  // Getters
  get id(): string { return this._id; }
  get reservationId(): string { return this._reservationId; }
  get deviceId(): string { return this._deviceId; }
  get checkInTime(): Date { return new Date(this._checkInTime); }
  get checkOutTime(): Date | undefined { return this._checkOutTime ? new Date(this._checkOutTime) : undefined; }
  get paymentStatus(): PaymentStatus { return this._paymentStatus; }
  get paymentMethod(): PaymentMethod | undefined { return this._paymentMethod; }
  get paymentAmount(): number { return this._paymentAmount; }
  get adjustedAmount(): number | undefined { return this._adjustedAmount; }
  get adjustmentReason(): string | undefined { return this._adjustmentReason; }
  get actualStartTime(): Date | undefined { return this._actualStartTime ? new Date(this._actualStartTime) : undefined; }
  get actualEndTime(): Date | undefined { return this._actualEndTime ? new Date(this._actualEndTime) : undefined; }
  get status(): CheckInStatus { return this._status; }
  get notes(): string | undefined { return this._notes; }
  get createdAt(): Date { return new Date(this._createdAt); }
  get updatedAt(): Date { return new Date(this._updatedAt); }

  /**
   * 최종 금액 (조정된 금액이 있으면 조정 금액, 없으면 원래 금액)
   */
  get finalAmount(): number {
    return this._adjustedAmount ?? this._paymentAmount;
  }

  /**
   * 실제 이용 시간 (분 단위)
   */
  get actualDuration(): number | undefined {
    if (!this._actualStartTime || !this._actualEndTime) {
      return undefined;
    }
    return Math.floor((this._actualEndTime.getTime() - this._actualStartTime.getTime()) / (1000 * 60));
  }

  /**
   * 결제 확인
   */
  confirmPayment(paymentMethod: PaymentMethodType): CheckIn {
    if (!this._status.isCheckedIn()) {
      throw new Error('체크인 상태에서만 결제를 확인할 수 있습니다');
    }

    const newPaymentStatus = PaymentStatus.completed();
    if (!this._paymentStatus.canTransitionTo(newPaymentStatus)) {
      throw new Error('결제를 완료할 수 없는 상태입니다');
    }

    this._paymentStatus = newPaymentStatus;
    this._paymentMethod = PaymentMethod.fromString(paymentMethod);
    this._status = CheckInStatus.inUse();
    this._actualStartTime = new Date();
    this._updatedAt = new Date();

    return this;
  }

  /**
   * 시간 조정
   */
  adjustTime(startTime?: Date, endTime?: Date): CheckIn {
    if (!this._status.isActive()) {
      throw new Error('활성 상태의 체크인만 시간을 조정할 수 있습니다');
    }

    if (startTime) {
      this._actualStartTime = startTime;
    }
    if (endTime) {
      this._actualEndTime = endTime;
    }
    this._updatedAt = new Date();

    return this;
  }

  /**
   * 금액 조정
   */
  adjustAmount(amount: number, reason: string): CheckIn {
    if (!this._status.isActive()) {
      throw new Error('활성 상태의 체크인만 금액을 조정할 수 있습니다');
    }

    if (amount < 0) {
      throw new Error('금액은 0원 이상이어야 합니다');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('조정 사유를 입력해주세요');
    }

    this._adjustedAmount = amount;
    this._adjustmentReason = reason;
    this._updatedAt = new Date();

    return this;
  }

  /**
   * 체크아웃 처리
   */
  checkOut(): CheckIn {
    if (!this._status.isInUse()) {
      throw new Error('사용중 상태에서만 체크아웃할 수 있습니다');
    }

    this._checkOutTime = new Date();
    this._actualEndTime = this._actualEndTime || new Date();
    this._status = CheckInStatus.completed();
    this._updatedAt = new Date();

    return this;
  }

  /**
   * 체크인 취소
   */
  cancel(reason?: string): CheckIn {
    if (!this._status.canTransitionTo(CheckInStatus.cancelled())) {
      throw new Error('취소할 수 없는 상태입니다');
    }

    this._status = CheckInStatus.cancelled();
    this._paymentStatus = PaymentStatus.cancelled();
    if (reason) {
      this._notes = reason;
    }
    this._updatedAt = new Date();

    return this;
  }

  /**
   * 메모 추가/수정
   */
  updateNotes(notes: string): CheckIn {
    this._notes = notes;
    this._updatedAt = new Date();
    return this;
  }

  /**
   * 활성 상태인지 확인
   */
  isActive(): boolean {
    return this._status.isActive();
  }

  /**
   * 결제 대기중인지 확인
   */
  isWaitingPayment(): boolean {
    return this._status.isCheckedIn() && this._paymentStatus.isPending();
  }

  /**
   * DTO 변환
   */
  toJSON(): CheckInProps {
    return {
      id: this._id,
      reservationId: this._reservationId,
      deviceId: this._deviceId,
      checkInTime: this._checkInTime,
      checkOutTime: this._checkOutTime,
      paymentStatus: this._paymentStatus.value,
      paymentMethod: this._paymentMethod?.value,
      paymentAmount: this._paymentAmount,
      adjustedAmount: this._adjustedAmount,
      adjustmentReason: this._adjustmentReason,
      actualStartTime: this._actualStartTime,
      actualEndTime: this._actualEndTime,
      status: this._status.value,
      notes: this._notes,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }
}