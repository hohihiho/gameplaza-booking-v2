import { TimeSlotSchedule } from '../../../domain/entities/time-slot-schedule'
import { TimeSlotScheduleRepository } from '../../../domain/repositories/time-slot-schedule-repository.interface'

export interface GetTimeSlotSchedulesQuery {
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  deviceTypeId?: string
}

export interface TimeSlotScheduleDto {
  id: string
  date: string
  deviceTypeId: string
  deviceTypeName?: string
  templates: Array<{
    id: string
    name: string
    description?: string
    type: 'early' | 'overnight'
    startHour: number
    endHour: number
    displayTime: string
    duration: number
    isActive: boolean
    priority: number
  }>
  createdAt: string
  updatedAt: string
}

export interface GetTimeSlotSchedulesResult {
  schedules: TimeSlotScheduleDto[]
  total: number
  period: {
    startDate: string
    endDate: string
  }
}

export class GetTimeSlotSchedulesUseCase {
  constructor(
    private readonly scheduleRepository: TimeSlotScheduleRepository
  ) {}

  async execute(query: GetTimeSlotSchedulesQuery): Promise<GetTimeSlotSchedulesResult> {
    // 입력값 검증
    this.validateQuery(query)

    // 날짜 파싱
    const startDate = this.parseDate(query.startDate)
    const endDate = this.parseDate(query.endDate)

    // 스케줄 조회
    const schedules = await this.scheduleRepository.findByDateRange({
      startDate,
      endDate,
      deviceTypeId: query.deviceTypeId
    })

    // DTO로 변환
    const scheduleDtos: TimeSlotScheduleDto[] = schedules.map(schedule => ({
      id: schedule.id,
      date: schedule.dateString,
      deviceTypeId: schedule.deviceTypeId,
      deviceTypeName: schedule.deviceTypeName,
      templates: schedule.templates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        type: template.type,
        startHour: template.timeSlot.startHour,
        endHour: template.timeSlot.endHour,
        displayTime: template.timeSlot.formatKST(),
        duration: template.timeSlot.duration,
        isActive: template.isActive,
        priority: template.priority
      })),
      createdAt: schedule.createdAt.toISOString(),
      updatedAt: schedule.updatedAt.toISOString()
    }))

    return {
      schedules: scheduleDtos,
      total: scheduleDtos.length,
      period: {
        startDate: query.startDate,
        endDate: query.endDate
      }
    }
  }

  private validateQuery(query: GetTimeSlotSchedulesQuery): void {
    if (!query.startDate || !this.isValidDateFormat(query.startDate)) {
      throw new Error('올바른 시작 날짜 형식(YYYY-MM-DD)을 입력해주세요')
    }

    if (!query.endDate || !this.isValidDateFormat(query.endDate)) {
      throw new Error('올바른 종료 날짜 형식(YYYY-MM-DD)을 입력해주세요')
    }

    // 시작일이 종료일보다 이후인 경우
    if (query.startDate > query.endDate) {
      throw new Error('종료일은 시작일 이후여야 합니다')
    }

    // 조회 기간이 너무 긴 경우 (예: 1년 이상)
    const start = this.parseDate(query.startDate)
    const end = this.parseDate(query.endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays > 365) {
      throw new Error('조회 기간은 1년을 초과할 수 없습니다')
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