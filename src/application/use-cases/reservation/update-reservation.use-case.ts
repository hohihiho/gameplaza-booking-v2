import { Reservation } from '@/src/domain/entities/reservation'
import { ReservationRepository } from '@/src/domain/repositories/reservation.repository.interface'
import { UserRepository } from '@/src/domain/repositories/user.repository.interface'
import { DeviceRepository } from '@/src/domain/repositories/device.repository.interface'
import { PaymentRepository } from '@/src/domain/repositories/payment.repository.interface'
import { NotificationRepository } from '@/src/domain/repositories/notification.repository.interface'
import { NotificationService } from '@/src/domain/services/notification.service.interface'
import { ReservationDate } from '@/src/domain/value-objects/reservation-date'
import { TimeSlot } from '@/src/domain/value-objects/time-slot'
import { SendReservationNotificationUseCase } from '../notification/send-reservation-notification.use-case'

export interface UpdateReservationRequest {
  userId: string
  reservationId: string
  date?: string // YYYY-MM-DD 형식
  timeSlot?: {
    startHour: number
    endHour: number
  }
  note?: string
}

export interface UpdateReservationResponse {
  reservation: Reservation
  message: string
}

/**
 * 예약 업데이트 유스케이스
 * 사용자 또는 관리자가 예약 정보를 수정
 */
export class UpdateReservationUseCase {
  constructor(
    private reservationRepository: ReservationRepository,
    private userRepository: UserRepository,
    private deviceRepository: DeviceRepository,
    private paymentRepository?: PaymentRepository,
    private notificationRepository?: NotificationRepository,
    private notificationService?: NotificationService
  ) {}

  async execute(request: UpdateReservationRequest): Promise<UpdateReservationResponse> {
    // 1. 사용자 확인
    const user = await this.userRepository.findById(request.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    // 2. 예약 조회
    const reservation = await this.reservationRepository.findById(request.reservationId)
    if (!reservation) {
      throw new Error('예약을 찾을 수 없습니다')
    }

    // 3. 권한 확인
    const isOwner = reservation.userId === request.userId
    const isAdmin = user.role === 'admin'

    if (!isOwner && !isAdmin) {
      throw new Error('예약을 수정할 권한이 없습니다')
    }

    // 4. 예약 상태 확인 (변경 가능한 상태인지)
    const allowedStatuses = ['pending', 'confirmed']
    if (!allowedStatuses.includes(reservation.status.value)) {
      throw new Error('현재 상태에서는 예약을 수정할 수 없습니다')
    }

    // 5. 체크인 시간 임박 확인 (사용자의 경우)
    if (isOwner && !isAdmin) {
      const hoursUntilStart = reservation.getHoursUntilStart()
      if (hoursUntilStart < 24) {
        throw new Error('예약 시작 24시간 전에는 수정할 수 없습니다')
      }
    }

    // 6. 결제 상태 확인 (결제 완료된 경우)
    if (this.paymentRepository) {
      const payment = await this.paymentRepository.findByReservationId(reservation.id)
      if (payment && payment.isCompleted()) {
        if (!isAdmin) {
          throw new Error('결제가 완료된 예약은 관리자만 수정할 수 있습니다')
        }
      }
    }

    // 7. 변경 사항 준비
    let hasDateChange = false
    let hasTimeChange = false
    const originalDate = reservation.date.dateString
    const originalTimeSlot = `${reservation.timeSlot.startHour}:00-${reservation.timeSlot.endHour}:00`

    // 8. 날짜 변경 처리
    if (request.date && request.date !== reservation.date.dateString) {
      hasDateChange = true
      const newDate = ReservationDate.fromString(request.date)
      
      // 과거 날짜 체크
      if (newDate.isPast()) {
        throw new Error('과거 날짜로는 예약할 수 없습니다')
      }
    }

    // 9. 시간대 변경 처리
    if (request.timeSlot) {
      const currentSlot = reservation.timeSlot
      if (request.timeSlot.startHour !== currentSlot.startHour || 
          request.timeSlot.endHour !== currentSlot.endHour) {
        hasTimeChange = true
        
        // 시간대 유효성 검증
        const newTimeSlot = new TimeSlot(request.timeSlot.startHour, request.timeSlot.endHour)
        
        // 영업시간 확인 (10:00 ~ 익일 05:00)
        if (newTimeSlot.startHour < 10 && newTimeSlot.startHour >= 6) {
          throw new Error('영업시간은 10:00부터 익일 05:00까지입니다')
        }
      }
    }

    // 10. 날짜 또는 시간이 변경된 경우 중복 체크
    if (hasDateChange || hasTimeChange) {
      const targetDate = request.date ? ReservationDate.fromString(request.date) : reservation.date
      const targetTimeSlot = request.timeSlot 
        ? new TimeSlot(request.timeSlot.startHour, request.timeSlot.endHour)
        : reservation.timeSlot

      // 해당 시간대에 다른 예약이 있는지 확인
      const existingReservations = await this.reservationRepository.findByDeviceAndDateRange(
        reservation.deviceId,
        targetDate,
        targetDate
      )

      const hasConflict = existingReservations.some(existing => {
        if (existing.id === reservation.id) return false // 자기 자신 제외
        if (existing.status.value === 'cancelled') return false // 취소된 예약 제외
        return existing.timeSlot.overlaps(targetTimeSlot)
      })

      if (hasConflict) {
        throw new Error('선택한 시간대에 이미 다른 예약이 있습니다')
      }
    }

    // 11. 예약 업데이트
    if (request.date) {
      reservation.changeDate(ReservationDate.fromString(request.date))
    }

    if (request.timeSlot) {
      reservation.changeTimeSlot(new TimeSlot(request.timeSlot.startHour, request.timeSlot.endHour))
    }

    if (request.note !== undefined) {
      reservation.updateNote(request.note)
    }

    // 12. 저장
    const updatedReservation = await this.reservationRepository.update(reservation)

    // 13. 변경 알림 발송
    if ((hasDateChange || hasTimeChange) && this.notificationRepository && this.notificationService) {
      try {
        await this.sendUpdateNotification(
          updatedReservation, 
          originalDate, 
          originalTimeSlot,
          hasDateChange,
          hasTimeChange
        )
      } catch (error) {
        console.error('Failed to send update notification:', error)
      }
    }

    // 14. 응답 메시지 생성
    const changes = []
    if (hasDateChange) changes.push('날짜')
    if (hasTimeChange) changes.push('시간')
    if (request.note !== undefined) changes.push('메모')

    const message = changes.length > 0
      ? `예약이 수정되었습니다 (변경: ${changes.join(', ')})`
      : '예약 정보가 업데이트되었습니다'

    return {
      reservation: updatedReservation,
      message
    }
  }

  /**
   * 예약 변경 알림 발송
   */
  private async sendUpdateNotification(
    reservation: Reservation,
    originalDate: string,
    originalTimeSlot: string,
    hasDateChange: boolean,
    hasTimeChange: boolean
  ): Promise<void> {
    if (!this.notificationRepository || !this.notificationService || !this.deviceRepository) {
      return
    }

    const device = await this.deviceRepository.findById(reservation.deviceId)
    if (!device) return

    const notificationUseCase = new SendReservationNotificationUseCase(
      this.notificationRepository,
      this.reservationRepository,
      this.deviceRepository,
      this.userRepository,
      this.notificationService
    )

    const changes = []
    if (hasDateChange) {
      changes.push(`날짜: ${originalDate} → ${reservation.date.dateString}`)
    }
    if (hasTimeChange) {
      changes.push(`시간: ${originalTimeSlot} → ${reservation.timeSlot.startHour}:00-${reservation.timeSlot.endHour}:00`)
    }

    await notificationUseCase.execute({
      reservationId: reservation.id,
      type: 'reservation_updated',
      additionalData: {
        deviceNumber: device.deviceNumber,
        changes: changes.join(', ')
      }
    })
  }
}