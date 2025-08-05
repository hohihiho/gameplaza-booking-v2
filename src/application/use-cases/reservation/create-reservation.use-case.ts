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

    // 6. rental_time_slots에서 직접 시간대 및 가격 정보 조회
    const rentalTimeSlot = await this.getRentalTimeSlot(device.typeId, command.startHour, command.endHour)
    
    if (!rentalTimeSlot) {
      throw new Error('선택한 시간대는 예약이 불가능합니다')
    }

    // 7. 선택한 크레딧 타입이 가능한지 확인
    const creditOption = rentalTimeSlot.credit_options?.find((opt: any) => opt.type === command.creditType)
    if (!creditOption) {
      throw new Error(`선택한 시간대에서는 ${command.creditType} 옵션을 사용할 수 없습니다`)
    }

    // 8. 2인 플레이 가능 여부 확인
    if (command.playerCount === 2 && !rentalTimeSlot.enable_2p) {
      throw new Error('해당 시간대는 2인 플레이가 불가능합니다')
    }

    // 9. 청소년 시간대 제한 확인
    if (rentalTimeSlot.is_youth_time) {
      const userAge = user.getAge()
      if (userAge && userAge >= 16) {
        throw new Error('성인은 청소년 시간대를 예약할 수 없습니다')
      }
    }

    // 10. 가격 계산
    const hours = command.endHour - command.startHour
    const totalPrice = this.calculatePrice(creditOption, hours, command.playerCount === 2, rentalTimeSlot.price_2p_extra)

    if (totalPrice === null) {
      throw new Error('가격 정보를 찾을 수 없습니다')
    }

    // 11. 예약 생성 (가격 정보 포함)
    const reservation = Reservation.create({
      id: this.generateId(),
      userId: command.userId,
      deviceId: command.deviceId,
      date: kstDate,
      timeSlot,
      totalAmount: totalPrice
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

    // 15. 시간대별 최대 대여 가능 대수 제한 검증
    await this.validateMaxRentalUnits(device.typeId, reservation, rentalTimeSlot.max_rental_units)

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

  /**
   * 시간대별 최대 대여 가능 대수 제한 검증
   * 조기/밤샘 시간대 전체에 대한 제한을 적용
   */
  private async validateMaxRentalUnits(deviceTypeId: string, reservation: Reservation, maxRentalUnits?: number): Promise<void> {
    // max_rental_units가 설정되지 않은 경우 제한 없음
    if (!maxRentalUnits) {
      return
    }

    // DeviceRepository를 통해 Supabase 클라이언트에 접근
    const deviceRepo = this.deviceRepository as any
    if (!deviceRepo.supabase) {
      throw new Error('Supabase 클라이언트에 접근할 수 없습니다')
    }

    // 예약하려는 시간대의 타입 결정 (조기/밤샘)
    const timeSlotType = this.getTimeSlotType(reservation.timeSlot.startHour)
    
    if (!timeSlotType) {
      return // 시간대 타입을 알 수 없는 경우 제한 없음
    }

    // 해당 기기 타입의 같은 시간대 타입(조기/밤샘)에 이미 예약된 개수 조회
    let timeRangeCondition: string
    if (timeSlotType === 'early') {
      // 조기 시간대: 10:00-22:00 (10~22시)
      timeRangeCondition = `start_time >= '10:00:00' AND start_time < '22:00:00'`
    } else {
      // 밤샘 시간대: 22:00-05:00 (22~29시를 22~23시와 00~05시로 분할)
      timeRangeCondition = `(start_time >= '22:00:00' OR (start_time >= '00:00:00' AND start_time <= '05:00:00'))`
    }

    const { data: existingReservations, error } = await deviceRepo.supabase
      .rpc('get_reservations_by_time_range', {
        target_device_type_id: deviceTypeId,
        target_date: reservation.date.dateString,
        time_condition: timeRangeCondition
      })

    // RPC가 없는 경우 직접 쿼리 사용
    if (error || !existingReservations) {
      console.log('RPC 실패, 직접 쿼리 사용:', error)
      
      const { data: directQuery, error: directError } = await deviceRepo.supabase
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

      if (directError) {
        console.error('기존 예약 조회 오류:', directError)
        throw new Error('예약 가능 여부를 확인할 수 없습니다')
      }

      // 같은 기기 타입이면서 같은 시간대 타입의 예약만 필터링
      const sameTypeReservations = (directQuery || []).filter((res: any) => {
        if (res.devices?.device_types?.id !== deviceTypeId) return false
        
        const existingStartHour = parseInt(res.start_time.split(':')[0])
        const existingTimeSlotType = this.getTimeSlotType(existingStartHour)
        
        return existingTimeSlotType === timeSlotType
      })

      if (sameTypeReservations.length >= maxRentalUnits) {
        const timeSlotName = timeSlotType === 'early' ? '조기 시간대' : '밤샘 시간대'
        throw new Error(`${timeSlotName}에 이미 예약이 있습니다. 최대 대여 가능 대수(${maxRentalUnits}대)를 초과했습니다`)
      }

      return
    }

    // RPC 결과 처리
    const reservationCount = existingReservations.length || 0
    if (reservationCount >= maxRentalUnits) {
      const timeSlotName = timeSlotType === 'early' ? '조기 시간대' : '밤샘 시간대'
      throw new Error(`${timeSlotName}에 이미 예약이 있습니다. 최대 대여 가능 대수(${maxRentalUnits}대)를 초과했습니다`)
    }
  }

  /**
   * 시간대 타입 결정 (조기/밤샘)
   */
  private getTimeSlotType(startHour: number): 'early' | 'night' | null {
    if (startHour >= 10 && startHour < 22) {
      return 'early' // 조기 시간대 (10~21시)
    } else if (startHour >= 22 || (startHour >= 0 && startHour <= 5)) {
      return 'night' // 밤샘 시간대 (22~29시)
    }
    return null
  }


  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * rental_time_slots에서 해당 기기 타입과 시간대에 맞는 설정 조회
   */
  private async getRentalTimeSlot(deviceTypeId: string, startHour: number, endHour: number): Promise<any> {
    // DeviceRepository를 통해 Supabase 클라이언트에 접근
    const deviceRepo = this.deviceRepository as any
    if (!deviceRepo.supabase) {
      throw new Error('Supabase 클라이언트에 접근할 수 없습니다')
    }

    // 요청한 시간대와 정확히 일치하는 rental_time_slot 찾기
    const startTimeStr = `${startHour.toString().padStart(2, '0')}:00:00`
    const endTimeStr = `${endHour.toString().padStart(2, '0')}:00:00`

    const { data, error } = await deviceRepo.supabase
      .from('rental_time_slots')
      .select('*')
      .eq('device_type_id', deviceTypeId)
      .eq('start_time', startTimeStr)
      .eq('end_time', endTimeStr)
      .single()

    if (error) {
      console.error('rental_time_slots 조회 오류:', error)
      // 정확한 매칭이 안 되면 포함되는 시간대 찾기
      const { data: fallbackData, error: fallbackError } = await deviceRepo.supabase
        .from('rental_time_slots')
        .select('*')
        .eq('device_type_id', deviceTypeId)
        .lte('start_time', startTimeStr)
        .gte('end_time', endTimeStr)
        .single()

      if (fallbackError) {
        console.error('rental_time_slots fallback 조회 오류:', fallbackError)
        return null
      }

      return fallbackData
    }

    return data
  }

  /**
   * 크레딧 옵션과 시간에 따른 가격 계산
   */
  private calculatePrice(creditOption: any, hours: number, is2P: boolean, price2PExtra?: number): number | null {
    if (!creditOption) return null

    let basePrice = 0

    // 크레딧 타입에 따른 기본 가격 계산
    if (creditOption.type === 'fixed') {
      basePrice = creditOption.fixedCredits || 0
    } else if (creditOption.type === 'freeplay') {
      // 시간당 가격이 있는 경우
      if (creditOption.prices && creditOption.prices[hours]) {
        basePrice = creditOption.prices[hours]
      } else if (creditOption.hourlyRate) {
        basePrice = creditOption.hourlyRate * hours
      } else {
        basePrice = 25000 // 기본 프리플레이 가격
      }
    } else if (creditOption.type === 'unlimited') {
      basePrice = creditOption.unlimitedPrice || 50000
    }

    // 2인 플레이 추가 요금
    if (is2P && price2PExtra) {
      basePrice += price2PExtra
    }

    return basePrice
  }
}