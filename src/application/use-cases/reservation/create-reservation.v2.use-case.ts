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
import { ReservationRulesService } from '@/src/domain/services/reservation-rules.service'

export interface CreateReservationRequest {
  userId: string
  deviceId: string
  date: string // YYYY-MM-DD
  startHour: number // 0-29
  endHour: number // 1-30
  userNotes?: string
  isAdmin?: boolean // 관리자 여부
  createdByUserId?: string // 실제 예약 생성자 (onBehalf인 경우)
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

    // 6-1. 특별 운영 시간대 24시간 규칙 검증 (밤샘/조기개장만)
    // 관리자는 24시간 제한 해제
    if (!request.isAdmin) {
      const specialHoursValidation = ReservationRulesService.validateSpecialOperatingHours(reservation)
      if (!specialHoursValidation.isValid) {
        throw new Error(specialHoursValidation.errors[0])
      }
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

    // 8. 사용자 시간 충돌 검증 제거 - 같은 시간대 여러 기기 예약 가능
    // await this.validateNoUserTimeConflict(reservation) // 비활성화

    // 9. 동시 예약 개수 제한 검증 (관리자는 제외)
    if (!request.isAdmin) {
      await this.validateReservationLimit(request.userId)
    }

    // 10. 시간대별 최대 대여 가능 대수 제한 검증 (조기/밤샘 전체 시간대)
    console.log('validateMaxRentalUnitsForTimeSlot 호출:', {
      deviceTypeId: device.deviceTypeId,
      date: reservation.date.dateString,
      timeSlot: `${reservation.timeSlot.startHour}-${reservation.timeSlot.endHour}`
    })
    await this.validateMaxRentalUnitsForTimeSlot(device.deviceTypeId, reservation)

    // 11. 예약 저장
    const savedReservation = await this.reservationRepository.save(reservation)
    
    // 11-1. 대리 예약인 경우 created_by 필드 업데이트
    if (request.createdByUserId && request.createdByUserId !== request.userId) {
      const repo = this.reservationRepository as any
      if (repo.supabase) {
        await repo.supabase
          .from('reservations')
          .update({ created_by: request.createdByUserId })
          .eq('id', savedReservation.id)
      }
    }

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

    // 고정 시간대 시스템에서는 최소/최대 시간 제한 불필요
    // 사용자는 rental_time_slots에 정의된 시간대 중에서만 선택 가능
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

  // 사용자 시간 충돌 검증 제거 - 같은 시간대 여러 기기 예약 가능

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

  /**
   * 시간대별 최대 대여 가능 대수 제한 검증 (조기/밤샘 시간대 전체)
   */
  private async validateMaxRentalUnitsForTimeSlot(deviceTypeId: string, reservation: Reservation): Promise<void> {
    // DeviceRepository를 통해 Supabase 클라이언트에 접근
    const deviceRepo = this.deviceRepository as any
    if (!deviceRepo.supabase) {
      throw new Error('Supabase 클라이언트에 접근할 수 없습니다')
    }

    // 해당 기기 타입의 rental_settings에서 max_rental_units 조회
    const { data: deviceType, error: deviceTypeError } = await deviceRepo.supabase
      .from('device_types')
      .select('name, rental_settings')
      .eq('id', deviceTypeId)
      .single()

    console.log('기기 타입 정보:', deviceType)

    if (deviceTypeError || !deviceType || !deviceType.rental_settings?.max_rental_units) {
      console.log('max_rental_units 설정 없음, 제한 없이 진행')
      return // max_rental_units가 설정되지 않은 경우 제한 없음
    }

    const maxRentalUnits = deviceType.rental_settings.max_rental_units
    console.log(`${deviceType.name} max_rental_units:`, maxRentalUnits)

    // 예약하려는 시간대의 타입 결정 (조기/밤샘)
    const timeSlotType = this.getTimeSlotType(reservation.timeSlot.startHour)
    
    if (!timeSlotType) {
      return // 시간대 타입을 알 수 없는 경우 제한 없음
    }

    // 해당 기기 타입의 같은 시간대 타입(조기/밤샘)에 이미 예약된 개수 조회
    const { data: existingReservations, error: queryError } = await deviceRepo.supabase
      .from('reservations')
      .select(`
        id,
        start_time,
        devices!device_id (
          device_types!device_type_id (
            id
          )
        )
      `)
      .eq('date', reservation.date.dateString)
      .in('status', ['pending', 'approved', 'checked_in'])

    if (queryError) {
      console.error('기존 예약 조회 오류:', queryError)
      throw new Error('예약 가능 여부를 확인할 수 없습니다')
    }

    // 같은 기기 타입이면서 같은 시간대 타입의 예약만 필터링
    const sameTypeReservations = (existingReservations || []).filter((res: any) => {
      if (res.devices?.device_types?.id !== deviceTypeId) return false
      
      const existingStartHour = parseInt(res.start_time.split(':')[0])
      const existingTimeSlotType = this.getTimeSlotType(existingStartHour)
      
      return existingTimeSlotType === timeSlotType
    })

    console.log(`같은 시간대 타입(${timeSlotType}) 예약 수:`, sameTypeReservations.length)
    console.log('기존 예약들:', sameTypeReservations.map((r: any) => ({
      id: r.id,
      startTime: r.start_time,
      deviceType: r.devices?.device_types?.id
    })))

    if (sameTypeReservations.length >= maxRentalUnits) {
      const timeSlotName = timeSlotType === 'early' ? '조기 시간대' : '밤샘 시간대'
      throw new Error(`${timeSlotName}에 이미 예약이 있습니다. 최대 대여 가능 대수(${maxRentalUnits}대)를 초과했습니다`)
    }
  }

  /**
   * 시간대 타입 결정 (조기/밤샘)
   */
  private getTimeSlotType(startHour: number): 'early' | 'night' | null {
    if (startHour >= 7 && startHour <= 14) {
      return 'early' // 조기 시간대 (7~14시)
    } else if (startHour >= 22 || startHour <= 5) {
      return 'night' // 밤샘 시간대 (22~5시)
    }
    return null
  }
}