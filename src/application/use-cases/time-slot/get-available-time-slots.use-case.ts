import { TimeSlotTemplate, CreditType } from '../../../domain/entities/time-slot-template'
import { TimeSlotDomainService } from '../../../domain/services/time-slot-domain.service'
import { ReservationRepository } from '../../../domain/repositories/reservation-repository.interface'
import { DeviceRepository } from '../../../domain/repositories/device-repository.interface'

export interface GetAvailableTimeSlotsQuery {
  date: string // YYYY-MM-DD
  deviceId: string
  isYouth?: boolean // 청소년 여부
}

export interface AvailableTimeSlotDto {
  timeSlot: {
    id: string
    name: string
    description?: string
    startHour: number
    endHour: number
    displayTime: string
    duration: number
    type: 'early' | 'overnight'
  }
  available: boolean
  remainingSlots: number
  creditOptions: Array<{
    type: CreditType
    hours: number[]
    prices: Record<number, number>
    fixedCredits?: number
  }>
  enable2P: boolean
  price2PExtra?: number
  isYouthTime: boolean
}

export interface GetAvailableTimeSlotsResult {
  slots: AvailableTimeSlotDto[]
  date: string
  deviceInfo: {
    id: string
    typeId: string
    typeName: string
    deviceNumber: number
  }
}

export class GetAvailableTimeSlotsUseCase {
  constructor(
    private readonly domainService: TimeSlotDomainService,
    private readonly reservationRepository: ReservationRepository,
    private readonly deviceRepository: DeviceRepository
  ) {}

  async execute(query: GetAvailableTimeSlotsQuery): Promise<GetAvailableTimeSlotsResult> {
    // 입력값 검증
    this.validateQuery(query)

    // 날짜 파싱
    const date = this.parseDate(query.date)

    // 기기 정보 조회
    const device = await this.deviceRepository.findById(query.deviceId)
    if (!device) {
      throw new Error('기기를 찾을 수 없습니다')
    }

    // 사용 가능한 시간대 템플릿 조회
    let templates = await this.domainService.getAvailableTimeSlots(
      date,
      device.typeId
    )

    // 청소년인 경우 청소년 시간대만 필터링
    if (query.isYouth) {
      templates = templates.filter(t => t.isYouthTime)
    }

    // 각 템플릿에 대해 예약 가능 여부 확인
    const slots: AvailableTimeSlotDto[] = []

    for (const template of templates) {
      // 해당 시간대의 예약 현황 확인
      const existingReservations = await this.reservationRepository.findByTimeSlot(
        date,
        device.typeId,
        template.timeSlot.startHour,
        template.timeSlot.endHour,
        ['pending', 'approved', 'checked_in']
      )

      // 동일 기기 타입의 총 개수 확인
      const totalDevices = await this.deviceRepository.countByType(device.typeId)
      const reservedCount = existingReservations.length
      const remainingSlots = Math.max(0, totalDevices - reservedCount)

      slots.push({
        timeSlot: {
          id: template.id,
          name: template.name,
          description: template.description,
          startHour: template.timeSlot.startHour,
          endHour: template.timeSlot.endHour,
          displayTime: template.timeSlot.formatKST(),
          duration: template.timeSlot.duration,
          type: template.type
        },
        available: remainingSlots > 0,
        remainingSlots,
        creditOptions: template.creditOptions,
        enable2P: template.enable2P,
        price2PExtra: template.price2PExtra,
        isYouthTime: template.isYouthTime
      })
    }

    // 우선순위에 따라 정렬 (이미 템플릿이 우선순위로 정렬되어 있을 수 있음)
    return {
      slots,
      date: query.date,
      deviceInfo: {
        id: device.id,
        typeId: device.typeId,
        typeName: device.typeName,
        deviceNumber: device.deviceNumber
      }
    }
  }

  private validateQuery(query: GetAvailableTimeSlotsQuery): void {
    if (!query.date || !this.isValidDateFormat(query.date)) {
      throw new Error('올바른 날짜 형식(YYYY-MM-DD)을 입력해주세요')
    }

    if (!query.deviceId) {
      throw new Error('기기 ID는 필수입니다')
    }

    // 과거 날짜 검증
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const queryDate = this.parseDate(query.date)
    
    if (queryDate < today) {
      throw new Error('과거 날짜의 시간대는 조회할 수 없습니다')
    }
  }

  private isValidDateFormat(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/
    if (!regex.test(dateString)) return false

    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date.getTime())
  }

  private parseDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
}