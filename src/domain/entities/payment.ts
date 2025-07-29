import { Entity } from './entity'
import { KSTDateTime } from '../value-objects/kst-datetime'

export type PaymentStatus = 
  | 'pending'      // 결제 대기
  | 'completed'    // 결제 완료 (현장에서 처리됨)
  | 'cancelled'    // 결제 취소
  | 'refunded'     // 환불 완료
  | 'partial_refunded' // 부분 환불

export type PaymentMethod = 
  | 'cash'         // 현금 결제 (현장)
  | 'bank_transfer' // 계좌이체 (현장)

export interface PaymentProps {
  id: string
  reservationId: string
  userId: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  transactionId?: string // 내부 거래 번호
  receiptNumber?: string // 영수증 번호
  paidAt?: KSTDateTime
  cancelledAt?: KSTDateTime
  cancelledReason?: string
  refundedAt?: KSTDateTime
  refundedAmount?: number
  refundReason?: string
  metadata?: Record<string, any> // 추가 정보
  createdAt: KSTDateTime
  updatedAt: KSTDateTime
}

/**
 * 결제 엔티티
 */
export class Payment extends Entity<PaymentProps> {
  get reservationId(): string {
    return this.props.reservationId
  }

  get userId(): string {
    return this.props.userId
  }

  get amount(): number {
    return this.props.amount
  }

  get method(): PaymentMethod {
    return this.props.method
  }

  get status(): PaymentStatus {
    return this.props.status
  }

  get transactionId(): string | undefined {
    return this.props.transactionId
  }

  get receiptNumber(): string | undefined {
    return this.props.receiptNumber
  }

  get paidAt(): KSTDateTime | undefined {
    return this.props.paidAt
  }

  get cancelledAt(): KSTDateTime | undefined {
    return this.props.cancelledAt
  }

  get cancelledReason(): string | undefined {
    return this.props.cancelledReason
  }

  get refundedAt(): KSTDateTime | undefined {
    return this.props.refundedAt
  }

  get refundedAmount(): number | undefined {
    return this.props.refundedAmount
  }

  get refundReason(): string | undefined {
    return this.props.refundReason
  }

  get metadata(): Record<string, any> | undefined {
    return this.props.metadata
  }

  get createdAt(): KSTDateTime {
    return this.props.createdAt
  }

  get updatedAt(): KSTDateTime {
    return this.props.updatedAt
  }

  /**
   * 결제 생성
   */
  static create(props: Omit<PaymentProps, 'status' | 'createdAt' | 'updatedAt'>): Payment {
    const now = KSTDateTime.now()
    
    return new Payment({
      ...props,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    })
  }

  /**
   * 현장 결제 완료 처리
   */
  completeOnSite(receiptNumber?: string): void {
    if (this.props.status !== 'pending') {
      throw new Error('대기 중인 결제만 완료 처리할 수 있습니다')
    }

    this.props.status = 'completed'
    this.props.paidAt = KSTDateTime.now()
    this.props.transactionId = `ONSITE-${Date.now()}`
    if (receiptNumber) {
      this.props.receiptNumber = receiptNumber
    }
    this.props.updatedAt = KSTDateTime.now()
  }

  /**
   * 결제 완료 처리 (기존 메서드 유지 - 호환성)
   */
  complete(transactionId?: string, receiptNumber?: string): void {
    if (this.props.status !== 'pending') {
      throw new Error('대기 중인 결제만 완료할 수 있습니다')
    }

    this.props.status = 'completed'
    this.props.paidAt = KSTDateTime.now()
    if (transactionId) {
      this.props.transactionId = transactionId
    }
    if (receiptNumber) {
      this.props.receiptNumber = receiptNumber
    }
    this.props.updatedAt = KSTDateTime.now()
  }


  /**
   * 결제 취소
   */
  cancel(reason: string): void {
    if (this.props.status !== 'pending') {
      throw new Error('대기 중인 결제만 취소할 수 있습니다')
    }

    this.props.status = 'cancelled'
    this.props.cancelledAt = KSTDateTime.now()
    this.props.cancelledReason = reason
    this.props.updatedAt = KSTDateTime.now()
  }

  /**
   * 환불 처리 (수동 처리 - 현금 환불)
   */
  refund(amount: number, reason: string): void {
    if (this.props.status !== 'completed' && this.props.status !== 'partial_refunded') {
      throw new Error('완료된 결제만 환불할 수 있습니다')
    }

    if (amount > this.props.amount) {
      throw new Error('환불 금액은 결제 금액을 초과할 수 없습니다')
    }

    const previousRefundAmount = this.props.refundedAmount || 0
    const totalRefundAmount = previousRefundAmount + amount

    if (totalRefundAmount > this.props.amount) {
      throw new Error('총 환불 금액은 결제 금액을 초과할 수 없습니다')
    }

    this.props.status = totalRefundAmount === this.props.amount ? 'refunded' : 'partial_refunded'
    this.props.refundedAt = KSTDateTime.now()
    this.props.refundedAmount = totalRefundAmount
    this.props.refundReason = reason
    this.props.updatedAt = KSTDateTime.now()
  }

  /**
   * 결제가 완료되었는지 확인
   */
  isCompleted(): boolean {
    return this.props.status === 'completed'
  }


  /**
   * 환불 가능한지 확인 (수동 환불이므로 관리자 판단에 따름)
   */
  isRefundable(): boolean {
    return this.props.status === 'completed' || this.props.status === 'partial_refunded'
  }

  /**
   * 남은 환불 가능 금액
   */
  getRefundableAmount(): number {
    const refundedAmount = this.props.refundedAmount || 0
    return this.props.amount - refundedAmount
  }

  /**
   * 결제 금액 업데이트 (시간 조정 시 사용)
   */
  updateAmount(newAmount: number): Payment {
    if (newAmount < 0) {
      throw new Error('결제 금액은 0보다 커야 합니다')
    }

    if (this.props.status === 'completed' || this.props.status === 'refunded') {
      throw new Error('완료되거나 환불된 결제의 금액은 변경할 수 없습니다')
    }

    return new Payment({
      ...this.props,
      amount: newAmount,
      updatedAt: KSTDateTime.now()
    })
  }
}