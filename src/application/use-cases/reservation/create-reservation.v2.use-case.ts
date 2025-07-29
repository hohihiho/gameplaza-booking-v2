import { Reservation } from '@/src/domain/entities/reservation'
import { ReservationRepository } from '@/src/domain/repositories/reservation.repository.interface'
import { DeviceRepository } from '@/src/domain/repositories/device.repository.interface'
import { UserRepository } from '@/src/domain/repositories/user.repository.interface'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'
import { TimeSlot } from '@/src/domain/value-objects/time-slot'
import { v4 as uuidv4 } from 'uuid'
import { SendReservationNotificationUseCase } from '../notification/send-reservation-notification.use-case'
import { NotificationRepository } from '@/src/domain/repositories/notification.repository.interface'
import { NotificationService } from '@/src/domain/services/notification.service.interface'

export interface CreateReservationRequest {
  userId: string
  deviceId: string
  date: string // YYYY-MM-DD
  startHour: number // 0-29
  endHour: number // 1-30
  userNotes?: string
}

export interface CreateReservationResponse {
  reservation: Reservation
}

/**
 * 예약 생성 유스케이스 (v2)
 * Clean Architecture 패턴에 맞춰 재구현
 */
export class CreateReservationV2UseCase {
  constructor(
    private reservationRepository: ReservationRepository,
    private deviceRepository: DeviceRepository,
    private userRepository: UserRepository,
    private notificationRepository?: NotificationRepository,
    private notificationService?: NotificationService
  ) {}

  async execute(request: CreateReservationRequest): Promise<CreateReservationResponse> {
    // 1. 입력값 검증
    this.validateRequest(request)

    // 2. 사용자 조회 및 활성 상태 확인
    const user = await this.userRepository.findById(request.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    if (!user.isActive()) {
      throw new Error('활성 상태가 아닌 사용자는 예약할 수 없습니다')
    }

    // 3. 기기 조회 및 사용 가능 상태 확인
    const device = await this.deviceRepository.findById(request.deviceId)
    if (!device) {
      throw new Error('기기를 찾을 수 없습니다')
    }

    if (!device.isOperational()) {
      throw new Error('해당 기기는 현재 사용할 수 없습니다')
    }

    // 4. 예약 날짜와 시간대 생성
    const kstDate = KSTDateTime.fromString(request.date)
    const timeSlot = TimeSlot.create(request.startHour, request.endHour)

    // 5. 예약 엔티티 생성
    const reservation = Reservation.create({
      id: uuidv4(),
      userId: request.userId,
      deviceId: request.deviceId,
      date: kstDate,
      timeSlot: timeSlot
    })

    // 6. 비즈니스 규칙 검증

    // 6-1. 24시간 규칙 검증
    if (!reservation.isValidFor24HourRule()) {
      throw new Error('예약은 시작 시간 24시간 전까지만 가능합니다')
    }

    // 6-2. 과거 날짜 검증
    const now = KSTDateTime.now()
    if (reservation.startDateTime.isBefore(now)) {
      throw new Error('과거 시간대는 예약할 수 없습니다')
    }

    // 6-3. 최대 예약 기간 검증 (예: 3주 후까지만 예약 가능)
    const maxReservationDate = now.addDays(21)
    if (reservation.startDateTime.isAfter(maxReservationDate)) {
      throw new Error('예약은 최대 3주 후까지만 가능합니다')
    }

    // 7. 시간 충돌 검증 (해당 기기)
    await this.validateNoDeviceTimeConflict(reservation)

    // 8. 사용자 시간 충돌 검증 (1인 1기기 규칙)
    await this.validateNoUserTimeConflict(reservation)

    // 9. 동시 예약 개수 제한 검증
    await this.validateReservationLimit(request.userId)

    // 10. 예약 저장
    const savedReservation = await this.reservationRepository.save(reservation)

    // 11. 예약 생성 알림 발송 (옵션)
    if (this.notificationRepository && this.notificationService) {
      try {
        const notificationUseCase = new SendReservationNotificationUseCase(
          this.notificationRepository,
          this.reservationRepository,
          this.deviceRepository,
          this.userRepository,
          this.notificationService
        )

        await notificationUseCase.execute({
          reservationId: savedReservation.id,
          type: 'reservation_created'
        })
      } catch (error) {
        // 알림 발송 실패는 예약 생성을 막지 않음
        console.error('Failed to send reservation notification:', error)
      }
    }

    return {
      reservation: savedReservation
    }
  }

  /**
   * 요청 데이터 검증
   */
  private validateRequest(request: CreateReservationRequest): void {
    // 필수 필드 검증
    if (!request.userId) {
      throw new Error('사용자 ID는 필수입니다')
    }

    if (!request.deviceId) {
      throw new Error('기기 ID는 필수입니다')
    }

    // 날짜 형식 검증
    if (!request.date || !this.isValidDateFormat(request.date)) {
      throw new Error('올바른 날짜 형식(YYYY-MM-DD)을 입력해주세요')
    }

    // 시간 범위 검증
    if (request.startHour < 0 || request.startHour > 29) {
      throw new Error('시작 시간은 0-29 사이여야 합니다')
    }

    if (request.endHour < 1 || request.endHour > 30) {
      throw new Error('종료 시간은 1-30 사이여야 합니다')
    }

    if (request.startHour >= request.endHour) {
      throw new Error('종료 시간은 시작 시간보다 커야 합니다')
    }

    // 최소/최대 예약 시간 검증
    const duration = request.endHour - request.startHour
    if (duration < 1) {
      throw new Error('최소 예약 시간은 1시간입니다')
    }

    if (duration > 4) {
      throw new Error('최대 예약 시간은 4시간입니다')
    }
  }

  /**
   * 날짜 형식 검증
   */
  private isValidDateFormat(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/
    if (!regex.test(dateString)) return false

    const parts = dateString.split('-')
    const year = parseInt(parts[0])
    const month = parseInt(parts[1])
    const day = parseInt(parts[2])

    // 월과 일의 유효성 검증
    if (month < 1 || month > 12) return false
    if (day < 1 || day > 31) return false

    return true
  }

  /**
   * 기기 시간 충돌 검증
   */
  private async validateNoDeviceTimeConflict(reservation: Reservation): Promise<void> {
    const existingReservations = await this.reservationRepository.findByDeviceAndTimeRange(
      reservation.deviceId,
      reservation.startDateTime,
      reservation.endDateTime
    )

    const hasConflict = existingReservations.some(existing => 
      existing.isActive() && reservation.conflictsWith(existing)
    )

    if (hasConflict) {
      throw new Error('해당 시간대는 이미 예약되어 있습니다')
    }
  }

  /**
   * 사용자 시간 충돌 검증 (1인 1기기 규칙)
   */
  private async validateNoUserTimeConflict(reservation: Reservation): Promise<void> {
    const userReservations = await this.reservationRepository.findByUserAndTimeRange(
      reservation.userId,
      reservation.startDateTime,
      reservation.endDateTime
    )

    const hasConflict = userReservations.some(existing => 
      existing.isActive() && reservation.hasUserConflict(existing)
    )

    if (hasConflict) {
      throw new Error('동일 시간대에 이미 다른 기기를 예약하셨습니다')
    }
  }

  /**
   * 동시 예약 개수 제한 검증
   */
  private async validateReservationLimit(userId: string): Promise<void> {
    const activeReservations = await this.reservationRepository.findActiveByUserId(userId)
    
    // 미래 예약만 카운트 (과거 예약은 제외)
    const now = KSTDateTime.now()
    const futureActiveReservations = activeReservations.filter(r => 
      r.startDateTime.isAfter(now)
    )

    if (futureActiveReservations.length >= 3) {
      throw new Error('동시에 예약 가능한 최대 개수(3개)를 초과했습니다')
    }
  }
}