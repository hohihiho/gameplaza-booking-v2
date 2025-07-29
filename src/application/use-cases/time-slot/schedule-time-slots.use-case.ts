import { TimeSlotSchedule } from '../../../domain/entities/time-slot-schedule'
import { TimeSlotDomainService } from '../../../domain/services/time-slot-domain.service'

export interface ScheduleTimeSlotsCommand {
  date: string // YYYY-MM-DD
  deviceTypeId: string
  templateIds: string[]
  repeat?: {
    type: 'daily' | 'weekly' | 'monthly'
    endDate: string // YYYY-MM-DD
    daysOfWeek?: number[] // 0-6 (일-토)
  }
}

export interface ScheduleTimeSlotsResult {
  schedules: TimeSlotSchedule[]
  count: number
}

export class ScheduleTimeSlotsUseCase {
  constructor(
    private readonly domainService: TimeSlotDomainService
  ) {}

  async execute(command: ScheduleTimeSlotsCommand): Promise<ScheduleTimeSlotsResult> {
    // 입력값 검증
    this.validateCommand(command)

    // 날짜 파싱
    const date = this.parseDate(command.date)
    const repeat = command.repeat ? {
      type: command.repeat.type,
      endDate: this.parseDate(command.repeat.endDate),
      daysOfWeek: command.repeat.daysOfWeek
    } : undefined

    // 도메인 서비스를 통해 스케줄 설정
    const schedules = await this.domainService.scheduleTimeSlots({
      date,
      deviceTypeId: command.deviceTypeId,
      templateIds: command.templateIds,
      repeat
    })

    return {
      schedules,
      count: schedules.length
    }
  }

  private validateCommand(command: ScheduleTimeSlotsCommand): void {
    if (!command.date || !this.isValidDateFormat(command.date)) {
      throw new Error('올바른 날짜 형식(YYYY-MM-DD)을 입력해주세요')
    }

    if (!command.deviceTypeId) {
      throw new Error('기기 타입 ID는 필수입니다')
    }

    if (!command.templateIds || command.templateIds.length === 0) {
      throw new Error('최소 하나 이상의 템플릿을 선택해주세요')
    }

    // 반복 설정 검증
    if (command.repeat) {
      if (!['daily', 'weekly', 'monthly'].includes(command.repeat.type)) {
        throw new Error('올바른 반복 타입을 선택해주세요')
      }

      if (!command.repeat.endDate || !this.isValidDateFormat(command.repeat.endDate)) {
        throw new Error('반복 종료일을 올바른 형식(YYYY-MM-DD)으로 입력해주세요')
      }

      // 시작일이 종료일보다 이후인 경우
      if (command.date > command.repeat.endDate) {
        throw new Error('반복 종료일은 시작일 이후여야 합니다')
      }

      // 요일 검증
      if (command.repeat.daysOfWeek) {
        if (command.repeat.type !== 'weekly') {
          throw new Error('요일 선택은 주간 반복에서만 사용 가능합니다')
        }

        const invalidDays = command.repeat.daysOfWeek.filter(day => day < 0 || day > 6)
        if (invalidDays.length > 0) {
          throw new Error('요일은 0(일요일)부터 6(토요일) 사이의 값이어야 합니다')
        }
      }
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
    
    // month와 day가 undefined인 경우 처리
    if (!month || !day) {
      throw new Error('유효하지 않은 날짜 형식입니다')
    }
    
    return new Date(year, month - 1, day)
  }
}