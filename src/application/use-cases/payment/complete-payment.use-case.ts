import { Payment } from '@/src/domain/entities/payment'
import { PaymentRepository } from '@/src/domain/repositories/payment.repository.interface'
import { ReservationRepository } from '@/src/domain/repositories/reservation.repository.interface'
import { NotificationRepository } from '@/src/domain/repositories/notification.repository.interface'
import { NotificationService } from '@/src/domain/services/notification.service.interface'
import { SendReservationNotificationUseCase } from '../notification/send-reservation-notification.use-case'
import { UserRepository } from '@/src/domain/repositories/user.repository.interface'
import { DeviceRepository } from '@/src/domain/repositories/device.repository.interface'

export interface CompletePaymentRequest {
  userId: string // 관리자 ID
  paymentId: string
  receiptNumber?: string // 영수증 번호
}

export interface CompletePaymentResponse {
  payment: Payment
  reservation: any
  message: string
}

/**
 * 결제 완료 처리 유스케이스
 * 관리자가 현장에서 결제를 받고 완료 처리
 */
export class CompletePaymentUseCase {
  constructor(
    private paymentRepository: PaymentRepository,
    private reservationRepository: ReservationRepository,
    private userRepository: UserRepository,
    private deviceRepository?: DeviceRepository,
    private notificationRepository?: NotificationRepository,
    private notificationService?: NotificationService
  ) {}

  async execute(request: CompletePaymentRequest): Promise<CompletePaymentResponse> {
    // 1. 사용자 확인 (관리자만 가능)
    const user = await this.userRepository.findById(request.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    if (user.role !== 'admin') {
      throw new Error('관리자만 결제를 완료할 수 있습니다')
    }

    // 2. 결제 정보 조회
    const payment = await this.paymentRepository.findById(request.paymentId)
    if (!payment) {
      throw new Error('결제 정보를 찾을 수 없습니다')
    }

    // 3. 결제 상태 확인
    if (payment.isCompleted()) {
      throw new Error('이미 완료된 결제입니다')
    }

    if (payment.status !== 'pending') {
      throw new Error('대기 중인 결제만 완료할 수 있습니다')
    }

    // 4. 예약 정보 조회
    const reservation = await this.reservationRepository.findById(payment.reservationId)
    if (!reservation) {
      throw new Error('예약 정보를 찾을 수 없습니다')
    }

    // 5. 결제 완료 처리
    payment.completeOnSite(request.receiptNumber)
    const updatedPayment = await this.paymentRepository.update(payment)

    // 6. 예약 상태 업데이트 (결제 완료로)
    reservation.confirmPayment()
    await this.reservationRepository.update(reservation)

    // 7. 결제 완료 알림 발송 (옵션)
    if (this.notificationRepository && this.notificationService) {
      try {
        await this.sendPaymentNotification(payment, reservation)
      } catch (error) {
        // 알림 발송 실패는 결제 완료를 막지 않음
        console.error('Failed to send payment notification:', error)
      }
    }

    // 8. 결제자 정보 조회
    const paymentUser = await this.userRepository.findById(payment.userId)
    const customerName = paymentUser?.name || '고객'
    const methodText = payment.method === 'cash' ? '현금' : '계좌이체'

    return {
      payment: updatedPayment,
      reservation,
      message: `${customerName}님의 ${methodText} ${payment.amount.toLocaleString()}원 결제가 완료되었습니다.`
    }
  }

  /**
   * 결제 완료 알림 발송
   */
  private async sendPaymentNotification(payment: Payment, reservation: any): Promise<void> {
    if (!this.deviceRepository || !this.notificationRepository || !this.notificationService) {
      return
    }

    const notificationUseCase = new SendReservationNotificationUseCase(
      this.notificationRepository,
      this.reservationRepository,
      this.deviceRepository,
      this.userRepository,
      this.notificationService
    )

    await notificationUseCase.execute({
      reservationId: reservation.id,
      type: 'reservation_approved', // 결제 완료는 예약 승인과 동일
      additionalData: {
        paymentId: payment.id,
        amount: payment.amount,
        method: payment.method,
        receiptNumber: payment.receiptNumber
      }
    })
  }
}