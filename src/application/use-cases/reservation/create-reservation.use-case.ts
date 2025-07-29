import { Reservation } from '@/src/domain/entities/reservation'
import { ReservationRepository } from '@/src/domain/repositories/reservation.repository.interface'
import { DeviceRepository } from '@/src/domain/repositories/device.repository.interface'
import { UserRepository } from '@/src/domain/repositories/user-repository.interface'
import { TimeSlotDomainService } from '@/src/domain/services/time-slot-domain.service'
import { ReservationRulesService } from '@/src/domain/services/reservation-rules.service'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'
import { TimeSlot } from '@/src/domain/value-objects/time-slot'

export interface CreateReservationCommand {
  userId: string
  deviceId: string
  date: string // YYYY-MM-DD
  startHour: number
  endHour: number
  creditType: 'fixed' | 'freeplay' | 'unlimited'
  playerCount: 1 | 2
}

export interface CreateReservationResult {
  reservation: Reservation
  reservationNumber: string
  totalPrice: number
}

export class CreateReservationUseCase {
  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly deviceRepository: DeviceRepository,
    private readonly userRepository: UserRepository,
    private readonly timeSlotDomainService: TimeSlotDomainService
  ) {}

  async execute(command: CreateReservationCommand): Promise<CreateReservationResult> {
    // 1. 입력값 검증
    this.validateCommand(command)

    // 2. 사용자 조회 및 예약 권한 확인
    const user = await this.userRepository.findById(command.userId)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    if (!user.canReserve()) {
      throw new Error('예약 권한이 없습니다')
    }

    // 3. 기기 조회 및 가용성 확인
    const device = await this.deviceRepository.findById(command.deviceId)
    if (!device) {
      throw new Error('기기를 찾을 수 없습니다')
    }

    if (!device.isAvailable()) {
      throw new Error('해당 기기는 현재 예약이 불가능합니다')
    }

    // 4. 예약 날짜 생성
    const [year, month, day] = command.date.split('-').map(Number)
    
    // month와 day가 undefined인 경우 처리
    if (!month || !day) {
      throw new Error('유효하지 않은 날짜 형식입니다')
    }
    
    const reservationDate = new Date(year, month - 1, day)
    const kstDate = KSTDateTime.create(reservationDate)

    // 5. 시간대 생성
    const timeSlot = TimeSlot.create(command.startHour, command.endHour)

    // 6. 예약 가능 시간대 확인 및 가격 조회
    const availableTemplates = await this.timeSlotDomainService.getAvailableTimeSlots(
      reservationDate,
      device.typeId
    )

    const selectedTemplate = availableTemplates.find(template => 
      template.timeSlot.startHour === command.startHour &&
      template.timeSlot.endHour === command.endHour
    )

    if (!selectedTemplate) {
      throw new Error('선택한 시간대는 예약이 불가능합니다')
    }

    // 7. 선택한 크레딧 타입이 가능한지 확인
    const creditOption = selectedTemplate.creditOptions.find(opt => opt.type === command.creditType)
    if (!creditOption) {
      throw new Error(`선택한 시간대에서는 ${command.creditType} 옵션을 사용할 수 없습니다`)
    }

    // 8. 2인 플레이 가능 여부 확인
    if (command.playerCount === 2 && !selectedTemplate.enable2P) {
      throw new Error('해당 시간대는 2인 플레이가 불가능합니다')
    }

    // 9. 청소년 시간대 제한 확인
    if (selectedTemplate.isYouthTime) {
      const userAge = user.getAge()
      if (userAge && userAge >= 16) {
        throw new Error('성인은 청소년 시간대를 예약할 수 없습니다')
      }
    }

    // 10. 가격 계산
    const hours = command.endHour - command.startHour
    const totalPrice = selectedTemplate.getPrice(
      command.creditType,
      hours,
      command.playerCount === 2
    )

    if (totalPrice === null) {
      throw new Error('가격 정보를 찾을 수 없습니다')
    }

    // 11. 예약 생성
    const reservation = Reservation.create({
      id: this.generateId(),
      userId: command.userId,
      deviceId: command.deviceId,
      date: kstDate,
      timeSlot
    })

    // 12. 사용자의 모든 활성 예약 조회
    const activeReservations = await this.reservationRepository.findByUserId(
      command.userId,
      ['pending', 'approved', 'checked_in']
    )

    // 13. ReservationRulesService를 사용한 통합 검증
    const validationResult = ReservationRulesService.validateAll(
      reservation,
      activeReservations
    )

    if (!validationResult.isValid) {
      throw new Error(validationResult.errors.join(', '))
    }

    // 14. 기기별 시간 충돌 검증 (같은 기기의 예약)
    await this.validateNoTimeConflict(reservation)

    // 16. 예약 저장
    const savedReservation = await this.reservationRepository.save(reservation)

    // 17. 추가 정보 저장 (가격, 플레이어 수, 크레딧 타입 등)
    // 실제 구현에서는 예약 엔티티에 이 정보들을 포함시켜야 함

    return {
      reservation: savedReservation,
      reservationNumber: savedReservation.reservationNumber,
      totalPrice
    }
  }

  private validateCommand(command: CreateReservationCommand): void {
    if (!command.userId) {
      throw new Error('사용자 ID는 필수입니다')
    }

    if (!command.deviceId) {
      throw new Error('기기 ID는 필수입니다')
    }

    if (!command.date || !this.isValidDateFormat(command.date)) {
      throw new Error('올바른 날짜 형식(YYYY-MM-DD)을 입력해주세요')
    }

    if (command.startHour < 0 || command.startHour > 29) {
      throw new Error('시작 시간은 0-29 사이여야 합니다')
    }

    if (command.endHour < 1 || command.endHour > 30) {
      throw new Error('종료 시간은 1-30 사이여야 합니다')
    }

    if (command.startHour >= command.endHour) {
      throw new Error('종료 시간은 시작 시간보다 커야 합니다')
    }

    if (!['fixed', 'freeplay', 'unlimited'].includes(command.creditType)) {
      throw new Error('올바른 크레딧 타입을 선택해주세요')
    }

    if (![1, 2].includes(command.playerCount)) {
      throw new Error('플레이어 수는 1명 또는 2명이어야 합니다')
    }

    // 과거 날짜 검증
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const reservationDate = new Date(command.date)
    
    if (reservationDate < today) {
      throw new Error('과거 날짜에는 예약할 수 없습니다')
    }
  }

  private isValidDateFormat(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/
    if (!regex.test(dateString)) return false

    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date.getTime())
  }

  private async validateNoTimeConflict(reservation: Reservation): Promise<void> {
    const existingReservations = await this.reservationRepository.findByDeviceAndDateRange(
      reservation.deviceId,
      reservation.startDateTime.toDate(),
      reservation.endDateTime.toDate(),
      ['pending', 'approved', 'checked_in']
    )

    const conflicts = existingReservations.filter(existing => 
      reservation.conflictsWith(existing)
    )

    if (conflicts.length > 0) {
      throw new Error('해당 시간대는 이미 예약되어 있습니다')
    }
  }


  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}