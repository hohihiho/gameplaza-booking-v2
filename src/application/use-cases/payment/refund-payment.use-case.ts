import { Payment } from '@/src/domain/entities/payment'
import { PaymentRepository } from '@/src/domain/repositories/payment.repository.interface'
import { ReservationRepository } from '@/src/domain/repositories/reservation.repository.interface'
import { UserRepository } from '@/src/domain/repositories/user.repository.interface'

export interface RefundPaymentRequest {
  userId: string
  paymentId: string
  amount: number // 환불 금액 (수동 입력)
  reason: string
}

export interface RefundPaymentResponse {
  payment: Payment
  refundedAmount: number
  remainingAmount: number
  message: string
}

/**
 * 결제 환불 유스케이스
 * 관리자가 수동으로 현금 환불 처리
 */
export class RefundPaymentUseCase {
  constructor(
    private paymentRepository: PaymentRepository,
    private reservationRepository: ReservationRepository,
    private userRepository: UserRepository
  ) {}

  async execute(request: RefundPaymentRequest): Promise<RefundPaymentResponse> {
    // 1. 사용자 확인 (관리자만 가능)
    const user = await this.userRepository.findById(request.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    if (user.role !== 'admin') {
      throw new Error('관리자만 환불을 처리할 수 있습니다')
    }

    // 2. 결제 정보 조회
    const payment = await this.paymentRepository.findById(request.paymentId)
    if (!payment) {
      throw new Error('결제 정보를 찾을 수 없습니다')
    }

    // 3. 환불 가능 상태 확인
    if (!payment.isRefundable()) {
      throw new Error('환불 가능한 상태가 아닙니다')
    }

    // 4. 환불 금액 검증
    if (request.amount <= 0) {
      throw new Error('환불 금액은 0보다 커야 합니다')
    }

    if (request.amount > payment.getRefundableAmount()) {
      throw new Error(`환불 가능 금액(${payment.getRefundableAmount().toLocaleString()}원)을 초과했습니다`)
    }

    // 5. 예약 상태 확인
    const reservation = await this.reservationRepository.findById(payment.reservationId)
    if (!reservation) {
      throw new Error('예약 정보를 찾을 수 없습니다')
    }

    // 체크인 후에는 환불 불가
    if (reservation.status.value === 'checked_in' || reservation.status.value === 'completed') {
      throw new Error('이미 이용한 예약은 환불할 수 없습니다')
    }

    // 6. 환불 처리 (현금 환불이므로 바로 완료)
    payment.refund(request.amount, request.reason)
    const updatedPayment = await this.paymentRepository.update(payment)

    // 7. 전액 환불인 경우 예약 취소
    if (updatedPayment.status === 'refunded') {
      reservation.cancel()
      await this.reservationRepository.update(reservation)
    }

    // 8. 결제자 정보 조회 (환불 안내용)
    const paymentUser = await this.userRepository.findById(payment.userId)
    const customerName = paymentUser?.name || '고객'

    return {
      payment: updatedPayment,
      refundedAmount: request.amount,
      remainingAmount: updatedPayment.getRefundableAmount(),
      message: `${customerName}님께 현금 ${request.amount.toLocaleString()}원을 환불했습니다.`
    }
  }
}