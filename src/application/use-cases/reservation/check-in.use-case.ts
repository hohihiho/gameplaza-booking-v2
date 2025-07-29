import { Reservation } from '../../../domain/entities/reservation'
import { User } from '../../../domain/entities/user'
import { Device } from '../../../domain/entities/device'
import { Payment } from '../../../domain/entities/payment'
import { CheckIn } from '../../../domain/entities/checkin'
import { IReservationRepository } from '../../../domain/repositories/reservation.repository.interface'
import { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import { IDeviceRepository } from '../../../domain/repositories/device.repository.interface'
import { PaymentRepository } from '../../../domain/repositories/payment.repository.interface'
import { INotificationRepository } from '../../../domain/repositories/notification.repository.interface'
import { CheckInRepository } from '../../../domain/repositories/check-in.repository.interface'
import { Notification } from '../../../domain/entities/notification'
import { NotificationChannel } from '../../../domain/value-objects/notification-channel'
import { KSTDateTime } from '../../../domain/value-objects/kst-datetime'

export interface CheckInReservationRequest {
  userId: string
  reservationId: string
  paymentMethod?: 'cash' | 'card' | 'transfer' // 현장 결제 방식 선택
  paymentAmount?: number // 결제 금액 (미리 계산된 경우)
}

export interface CheckInReservationResponse {
  reservation: Reservation
  checkIn: CheckIn
  payment?: Payment
  assignedDevice: string
  message: string
}

export class CheckInReservationUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly reservationRepository: IReservationRepository,
    private readonly deviceRepository: IDeviceRepository,
    private readonly paymentRepository: IPaymentRepository,
    private readonly notificationRepository: INotificationRepository,
    private readonly checkInRepository: CheckInRepository
  ) {}

  async execute(request: CheckInReservationRequest): Promise<CheckInReservationResponse> {
    // 1. 사용자 확인 및 권한 검증
    const user = await this.userRepository.findById(request.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    if (user.role !== 'admin' && user.role !== 'staff') {
      throw new Error('관리자 또는 스태프만 체크인을 처리할 수 있습니다')
    }

    // 2. 예약 조회
    const reservation = await this.reservationRepository.findById(request.reservationId)
    if (!reservation) {
      throw new Error('예약을 찾을 수 없습니다')
    }

    // 3. 예약 상태 확인
    if (reservation.status.value !== 'approved') {
      throw new Error('승인된 예약만 체크인할 수 있습니다')
    }

    if (!reservation.assignedDeviceNumber) {
      throw new Error('기기가 배정되지 않은 예약입니다')
    }

    // 4. 체크인 가능 시간 확인 (예약 시작 1시간 전부터 가능)
    const now = KSTDateTime.now()
    const reservationStart = reservation.startDateTime
    const minutesUntilStart = now.differenceInMinutes(reservationStart)
    
    if (minutesUntilStart > 60) {
      throw new Error('예약 시작 1시간 전부터 체크인이 가능합니다')
    }

    // 5. 기기 상태 변경 (available -> in_use)
    const device = await this.deviceRepository.findByDeviceNumber(reservation.assignedDeviceNumber)
    if (!device) {
      throw new Error('배정된 기기를 찾을 수 없습니다')
    }

    if (!device.isAvailable() && !device.isReserved()) {
      throw new Error('기기가 사용 가능한 상태가 아닙니다')
    }

    const updatedDevice = device.changeStatus('in_use')
    await this.deviceRepository.update(updatedDevice)

    // 6. 예약 체크인 처리
    const checkedInReservation = reservation.checkIn()
    await this.reservationRepository.update(checkedInReservation)

    // 7. 결제 정보 확인 및 처리
    let payment: Payment | undefined
    let paymentAmount: number
    const existingPayments = await this.paymentRepository.findByReservationId(reservation.id)
    
    if (existingPayments.length === 0) {
      // 결제가 없으면 현장 결제 생성
      if (!request.paymentMethod) {
        throw new Error('결제 방식을 선택해주세요 (현금, 카드 또는 계좌이체)')
      }

      paymentAmount = request.paymentAmount || this.calculateAmount(reservation)
      payment = Payment.create({
        id: this.generateId(),
        userId: reservation.userId,
        reservationId: reservation.id,
        amount: paymentAmount,
        method: request.paymentMethod,
        status: 'pending'
      })
      
      await this.paymentRepository.save(payment)
    } else {
      payment = existingPayments[0]
      paymentAmount = payment?.amount ?? 0
    }

    // 8. 체크인 엔티티 생성 및 저장
    const checkIn = CheckIn.create({
      reservationId: reservation.id,
      userId: reservation.userId,
      deviceId: device.id,
      checkInTime: KSTDateTime.now(),
      status: 'checked_in',
      checkInBy: user.id,
      paymentAmount: paymentAmount,
      paymentMethod: request.paymentMethod || payment?.method || 'cash'
    })
    
    await this.checkInRepository.save(checkIn)

    // 9. 고객에게 체크인 알림 발송
    const customer = await this.userRepository.findById(reservation.userId)
    if (customer) {
      const notification = Notification.create({
        id: this.generateId(),
        userId: reservation.userId,
        type: 'check_in_completed',
        title: '체크인이 완료되었습니다',
        content: `예약번호 ${reservation.reservationNumber}의 체크인이 완료되었습니다. 배정된 기기: ${reservation.assignedDeviceNumber}`,
        channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
        metadata: {
          reservationId: reservation.id,
          deviceNumber: reservation.assignedDeviceNumber
        }
      })
      
      await this.notificationRepository.save(notification)
    }

    return {
      reservation: checkedInReservation,
      checkIn,
      payment,
      assignedDevice: reservation.assignedDeviceNumber,
      message: `체크인이 완료되었습니다. 기기번호: ${reservation.assignedDeviceNumber}`
    }
  }

  private calculateAmount(reservation: Reservation): number {
    // 시간당 요금 계산 (예: 시간당 10,000원)
    const hours = reservation.timeSlot.durationHours
    return hours * 10000
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}