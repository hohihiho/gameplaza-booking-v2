import { Reservation } from '../../../domain/entities/reservation'
import { User } from '../../../domain/entities/user'
import { Payment } from '../../../domain/entities/payment'
import { TimeAdjustment, TimeAdjustmentReason } from '../../../domain/value-objects/time-adjustment'
import { IReservationRepository } from '../../../domain/repositories/reservation.repository.interface'
import { IUserRepository } from '../../../domain/repositories/user.repository.interface'
import { PaymentRepository } from '../../../domain/repositories/payment.repository.interface'
import { INotificationRepository } from '../../../domain/repositories/notification.repository.interface'
import { ITimeAdjustmentRepository } from '../../../domain/repositories/time-adjustment.repository.interface'
import { IDeviceRepository } from '../../../domain/repositories/device.repository.interface'
import { Notification } from '../../../domain/entities/notification'
import { NotificationChannel } from '../../../domain/value-objects/notification-channel'
import { KSTDateTime } from '../../../domain/value-objects/kst-datetime'
import { TimeSlot } from '../../../domain/value-objects/time-slot'

export interface AdjustReservationTimeRequest {
  userId: string
  reservationId: string
  actualStartTime: string // ISO string
  actualEndTime: string   // ISO string
  reason: TimeAdjustmentReason
  reasonDetail?: string
}

export interface AdjustReservationTimeResponse {
  reservation: Reservation
  timeAdjustment: TimeAdjustment
  originalAmount: number
  adjustedAmount: number
  message: string
}

export class AdjustReservationTimeUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly reservationRepository: IReservationRepository,
    private readonly paymentRepository: IPaymentRepository,
    private readonly notificationRepository: INotificationRepository,
    private readonly timeAdjustmentRepository: ITimeAdjustmentRepository,
    private readonly deviceRepository?: IDeviceRepository
  ) {}

  async execute(request: AdjustReservationTimeRequest): Promise<AdjustReservationTimeResponse> {
    // 1. 사용자 확인 및 권한 검증
    const user = await this.userRepository.findById(request.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    if (user.role !== 'admin') {
      throw new Error('관리자만 시간을 조정할 수 있습니다')
    }

    // 2. 예약 조회
    const reservation = await this.reservationRepository.findById(request.reservationId)
    if (!reservation) {
      throw new Error('예약을 찾을 수 없습니다')
    }

    // 3. 체크인 상태 확인
    if (reservation.status.value !== 'checked_in') {
      throw new Error('체크인된 예약만 시간 조정이 가능합니다')
    }

    // 4. 시간 유효성 검증
    const actualStartTime = new Date(request.actualStartTime)
    const actualEndTime = new Date(request.actualEndTime)
    
    if (actualStartTime >= actualEndTime) {
      throw new Error('종료 시간은 시작 시간보다 이후여야 합니다')
    }

    // 5. 원래 예약 시간 계산
    const originalStartTime = reservation.startDateTime.toDate()
    const originalEndTime = reservation.endDateTime.toDate()

    // 6. 시간 조정 객체 생성
    const timeAdjustment = TimeAdjustment.create({
      originalStartTime,
      originalEndTime,
      actualStartTime,
      actualEndTime,
      reason: request.reason,
      reasonDetail: request.reasonDetail,
      adjustedBy: user.id,
      adjustedAt: new Date()
    })

    // 7. 예약 업데이트 (실제 시작/종료 시간 업데이트)
    const updatedReservation = this.updateReservationTimes(
      reservation,
      actualStartTime,
      actualEndTime
    )
    await this.reservationRepository.update(updatedReservation)

    // 8. 결제 금액 재계산
    const payments = await this.paymentRepository.findByReservationId(reservation.id)
    if (payments.length === 0) {
      throw new Error('결제 정보를 찾을 수 없습니다')
    }

    const payment = payments[0]
    const originalAmount = payment.amount
    const adjustedAmount = this.calculateAdjustedAmount(timeAdjustment)

    // 금액이 변경된 경우 결제 업데이트
    if (originalAmount !== adjustedAmount) {
      const updatedPayment = payment.updateAmount(adjustedAmount)
      await this.paymentRepository.update(updatedPayment)
    }

    // 9. 고객에게 시간 조정 알림 발송
    const customer = await this.userRepository.findById(reservation.userId)
    if (customer) {
      const notification = Notification.create({
        id: this.generateId(),
        userId: reservation.userId,
        type: 'time_adjusted',
        title: '이용 시간이 조정되었습니다',
        content: this.createNotificationContent(timeAdjustment, originalAmount, adjustedAmount),
        channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
        metadata: {
          reservationId: reservation.id,
          timeAdjustment: {
            originalMinutes: timeAdjustment.originalDurationMinutes,
            actualMinutes: timeAdjustment.actualDurationMinutes,
            reason: timeAdjustment.reason
          }
        }
      })
      
      await this.notificationRepository.save(notification)
    }

    // 10. 시간 조정 이력 저장
    await this.timeAdjustmentRepository.save(reservation.id, timeAdjustment)

    // 11. 종료 시간이 현재 시간보다 이전인 경우 기기 상태 즉시 업데이트
    const now = new Date()
    if (actualEndTime <= now && this.deviceRepository) {
      // 예약을 완료 상태로 변경
      const completedReservation = updatedReservation.complete()
      await this.reservationRepository.update(completedReservation)
      
      // 기기 상태를 available로 변경
      if (reservation.assignedDeviceNumber) {
        const device = await this.deviceRepository.findByDeviceNumber(reservation.assignedDeviceNumber)
        if (device && device.status === 'in_use') {
          const availableDevice = device.changeStatus('available')
          await this.deviceRepository.update(availableDevice)
        }
      }
      
      return {
        reservation: completedReservation,
        timeAdjustment,
        originalAmount,
        adjustedAmount,
        message: `시간이 조정되고 예약이 종료되었습니다. 조정 사유: ${timeAdjustment.reasonText}`
      }
    }

    return {
      reservation: updatedReservation,
      timeAdjustment,
      originalAmount,
      adjustedAmount,
      message: `시간이 조정되었습니다. 조정 사유: ${timeAdjustment.reasonText}`
    }
  }

  private updateReservationTimes(
    reservation: Reservation,
    actualStartTime: Date,
    actualEndTime: Date
  ): Reservation {
    // Reservation 엔티티에 직접 actualStartTime, actualEndTime를 업데이트하는 메서드가 없으므로
    // 새로운 Reservation 객체를 생성해야 함
    return Reservation.create({
      id: reservation.id,
      userId: reservation.userId,
      deviceId: reservation.deviceId,
      date: reservation.date,
      timeSlot: reservation.timeSlot,
      status: reservation.status,
      reservationNumber: reservation.reservationNumber,
      assignedDeviceNumber: reservation.assignedDeviceNumber,
      rejectionReason: reservation.rejectionReason,
      checkedInAt: reservation.checkedInAt,
      actualStartTime: actualStartTime,
      actualEndTime: actualEndTime,
      createdAt: reservation.createdAt,
      updatedAt: new Date()
    })
  }

  private calculateAdjustedAmount(timeAdjustment: TimeAdjustment): number {
    // 30분 단위로 올림 처리된 시간으로 요금 계산
    const chargeableHours = timeAdjustment.chargeableMinutes / 60
    return Math.ceil(chargeableHours * 10000) // 시간당 10,000원
  }

  private createNotificationContent(
    timeAdjustment: TimeAdjustment,
    originalAmount: number,
    adjustedAmount: number
  ): string {
    const diffMinutes = timeAdjustment.adjustmentMinutes
    const timeChange = diffMinutes > 0 
      ? `${diffMinutes}분 연장` 
      : `${Math.abs(diffMinutes)}분 단축`
    
    const amountChange = adjustedAmount - originalAmount
    const amountText = amountChange > 0
      ? `추가 요금: ${amountChange.toLocaleString()}원`
      : amountChange < 0
      ? `환불 예정: ${Math.abs(amountChange).toLocaleString()}원`
      : '요금 변동 없음'

    return `이용 시간이 ${timeChange}되었습니다.\n` +
           `조정 사유: ${timeAdjustment.reasonText}\n` +
           `${amountText}`
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}