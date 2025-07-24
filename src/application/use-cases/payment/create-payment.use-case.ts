import { Payment, PaymentMethod } from '@/src/domain/entities/payment'
import { PaymentRepository } from '@/src/domain/repositories/payment.repository.interface'
import { ReservationRepository } from '@/src/domain/repositories/reservation.repository.interface'
import { UserRepository } from '@/src/domain/repositories/user.repository.interface'
import { DeviceRepository } from '@/src/domain/repositories/device.repository.interface'
import { PaymentAmount } from '@/src/domain/value-objects/payment-amount'

export interface CreatePaymentRequest {
  userId: string
  reservationId: string
  method: PaymentMethod
}

export interface CreatePaymentResponse {
  payment: Payment
  message: string
}

/**
 * 결제 생성 유스케이스
 * 현장 결제를 위한 결제 레코드 생성
 */
export class CreatePaymentUseCase {
  constructor(
    private paymentRepository: PaymentRepository,
    private reservationRepository: ReservationRepository,
    private userRepository: UserRepository,
    private deviceRepository: DeviceRepository
  ) {}

  async execute(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    // 1. 사용자 확인
    const user = await this.userRepository.findById(request.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    // 2. 예약 확인
    const reservation = await this.reservationRepository.findById(request.reservationId)
    if (!reservation) {
      throw new Error('예약을 찾을 수 없습니다')
    }

    // 3. 예약 소유자 확인
    if (reservation.userId !== request.userId) {
      throw new Error('본인의 예약만 결제할 수 있습니다')
    }

    // 4. 예약 상태 확인
    if (!reservation.isPayable()) {
      throw new Error('결제 가능한 상태가 아닙니다')
    }

    // 5. 이미 결제가 있는지 확인
    const existingPayment = await this.paymentRepository.findByReservationId(request.reservationId)
    if (existingPayment && existingPayment.isCompleted()) {
      throw new Error('이미 결제가 완료된 예약입니다')
    }

    // 6. 기기 정보 조회 (정보 기록용)
    const device = await this.deviceRepository.findById(reservation.deviceId)
    if (!device) {
      throw new Error('기기를 찾을 수 없습니다')
    }

    // 7. 결제 금액 계산
    const amount = this.calculatePaymentAmount(reservation)

    // 8. 결제 엔티티 생성 (pending 상태)
    const payment = Payment.create({
      id: this.generateId(),
      reservationId: request.reservationId,
      userId: request.userId,
      amount: amount.toNumber(),
      method: request.method,
      metadata: {
        deviceId: device.id,
        deviceNumber: device.deviceNumber,
        deviceName: device.name,
        reservationDate: reservation.date.dateString,
        timeSlot: `${reservation.timeSlot.startHour}:00 - ${reservation.timeSlot.endHour}:00`,
        customerName: user.name,
        customerPhone: user.phoneNumber || ''
      }
    })

    // 9. 결제 저장
    const savedPayment = await this.paymentRepository.save(payment)

    // 10. 응답 메시지 생성
    const methodText = request.method === 'cash' ? '현금' : '계좌이체'
    const message = `현장에서 ${methodText}로 ${amount.toNumber().toLocaleString()}원을 결제해주세요.`

    return {
      payment: savedPayment,
      message
    }
  }

  /**
   * 결제 금액 계산
   */
  private calculatePaymentAmount(reservation: any): PaymentAmount {
    // 실제로는 예약의 시간대, 기기 타입, 할인 등을 고려하여 계산
    // 여기서는 임시로 고정 금액 사용
    const hourlyRate = 10000 // 시간당 1만원
    const hours = reservation.timeSlot.endHour - reservation.timeSlot.startHour
    
    return PaymentAmount.of(hourlyRate * hours)
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}