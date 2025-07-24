import { TimeSlotTemplate, TimeSlotType, CreditOption } from '../entities/time-slot-template'
import { TimeSlotSchedule } from '../entities/time-slot-schedule'
import { TimeSlot } from '../value-objects/time-slot'
import { TimeSlotTemplateRepository } from '../repositories/time-slot-template-repository.interface'
import { TimeSlotScheduleRepository } from '../repositories/time-slot-schedule-repository.interface'

export interface CreateTemplateRequest {
  name: string
  description?: string
  type: TimeSlotType
  startHour: number
  endHour: number
  creditOptions: CreditOption[]
  enable2P: boolean
  price2PExtra?: number
  isYouthTime: boolean
  priority?: number
  isActive?: boolean
}

export interface ScheduleTimeSlotRequest {
  date: Date
  deviceTypeId: string
  templateIds: string[]
  repeat?: {
    type: 'daily' | 'weekly' | 'monthly'
    endDate: Date
    daysOfWeek?: number[] // 0-6 (일-토)
  }
}

export class TimeSlotDomainService {
  constructor(
    private readonly templateRepository: TimeSlotTemplateRepository,
    private readonly scheduleRepository: TimeSlotScheduleRepository
  ) {}

  /**
   * 시간대 템플릿 생성
   */
  async createTemplate(request: CreateTemplateRequest): Promise<TimeSlotTemplate> {
    // 시간대 생성
    const timeSlot = TimeSlot.create(request.startHour, request.endHour)

    // 이름 중복 검사
    const existingTemplate = await this.templateRepository.findByName(request.name)
    if (existingTemplate) {
      throw new Error(`이미 존재하는 템플릿 이름입니다: ${request.name}`)
    }

    // 시간대 충돌 검사
    const conflictingTemplates = await this.templateRepository.findConflicting(
      request.startHour,
      request.endHour,
      request.type
    )
    
    if (conflictingTemplates.length > 0) {
      const conflicts = conflictingTemplates.map(t => t.name).join(', ')
      throw new Error(`시간대가 겹치는 템플릿이 있습니다: ${conflicts}`)
    }

    // 템플릿 생성
    const template = TimeSlotTemplate.create({
      id: this.generateId(),
      name: request.name,
      description: request.description,
      type: request.type,
      timeSlot,
      creditOptions: request.creditOptions,
      enable2P: request.enable2P,
      price2PExtra: request.price2PExtra,
      isYouthTime: request.isYouthTime,
      priority: request.priority || 0,
      isActive: request.isActive ?? true
    })

    return await this.templateRepository.save(template)
  }

  /**
   * 시간대 스케줄 설정
   */
  async scheduleTimeSlots(request: ScheduleTimeSlotRequest): Promise<TimeSlotSchedule[]> {
    const schedules: TimeSlotSchedule[] = []
    const dates = this.generateDates(request)

    // 템플릿들 조회
    const templates = await Promise.all(
      request.templateIds.map(id => this.templateRepository.findById(id))
    )
    
    const validTemplates = templates.filter((t): t is TimeSlotTemplate => t !== null)
    if (validTemplates.length !== request.templateIds.length) {
      throw new Error('일부 템플릿을 찾을 수 없습니다')
    }

    // 각 날짜에 대해 스케줄 생성
    for (const date of dates) {
      // 기존 스케줄 확인
      const existingSchedule = await this.scheduleRepository.findByDateAndDeviceType(
        date,
        request.deviceTypeId
      )

      if (existingSchedule) {
        // 기존 스케줄이 있으면 템플릿 교체
        const updatedSchedule = existingSchedule.replaceTemplates(validTemplates)
        schedules.push(await this.scheduleRepository.save(updatedSchedule))
      } else {
        // 새 스케줄 생성
        const schedule = TimeSlotSchedule.create({
          id: this.generateId(),
          date,
          deviceTypeId: request.deviceTypeId,
          templates: validTemplates
        })
        schedules.push(await this.scheduleRepository.save(schedule))
      }
    }

    return schedules
  }

  /**
   * 특정 날짜와 기기의 예약 가능한 시간대 조회
   */
  async getAvailableTimeSlots(
    date: Date, 
    deviceTypeId: string
  ): Promise<TimeSlotTemplate[]> {
    const schedule = await this.scheduleRepository.findByDateAndDeviceType(date, deviceTypeId)
    
    if (!schedule) {
      // 스케줄이 없으면 기본 템플릿 사용
      return await this.templateRepository.findAll({
        isActive: true,
        deviceTypeIds: [deviceTypeId]
      })
    }

    return schedule.activeTemplates
  }

  /**
   * 템플릿 수정
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<Omit<CreateTemplateRequest, 'startHour' | 'endHour'>>
  ): Promise<TimeSlotTemplate> {
    const template = await this.templateRepository.findById(templateId)
    if (!template) {
      throw new Error('템플릿을 찾을 수 없습니다')
    }

    // 이름 변경 시 중복 검사
    if (updates.name && updates.name !== template.name) {
      const existingTemplate = await this.templateRepository.findByName(updates.name)
      if (existingTemplate) {
        throw new Error(`이미 존재하는 템플릿 이름입니다: ${updates.name}`)
      }
    }

    const updatedTemplate = template.update(updates)
    return await this.templateRepository.save(updatedTemplate)
  }

  /**
   * 템플릿 삭제
   */
  async deleteTemplate(templateId: string): Promise<void> {
    // 사용 중인 스케줄 확인
    const schedules = await this.scheduleRepository.findByTemplateId(templateId)
    
    if (schedules.length > 0) {
      const dates = schedules.map(s => s.dateString).join(', ')
      throw new Error(`해당 템플릿이 사용 중입니다: ${dates}`)
    }

    await this.templateRepository.delete(templateId)
  }

  /**
   * 반복 설정에 따른 날짜 생성
   */
  private generateDates(request: ScheduleTimeSlotRequest): Date[] {
    const dates: Date[] = [request.date]

    if (!request.repeat) {
      return dates
    }

    const currentDate = new Date(request.date)
    const endDate = new Date(request.repeat.endDate)

    while (currentDate <= endDate) {
      if (request.repeat.type === 'daily') {
        currentDate.setDate(currentDate.getDate() + 1)
      } else if (request.repeat.type === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7)
      } else if (request.repeat.type === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1)
      }

      if (currentDate <= endDate) {
        // 요일 필터 적용
        if (request.repeat.daysOfWeek) {
          const dayOfWeek = currentDate.getDay()
          if (request.repeat.daysOfWeek.includes(dayOfWeek)) {
            dates.push(new Date(currentDate))
          }
        } else {
          dates.push(new Date(currentDate))
        }
      }
    }

    return dates
  }

  /**
   * ID 생성 (실제 구현에서는 UUID 라이브러리 사용)
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 특정 크레딧 타입과 시간에 대한 가격 조회
   */
  async getPrice(
    date: Date,
    deviceTypeId: string,
    startHour: number,
    endHour: number,
    creditType: 'fixed' | 'freeplay' | 'unlimited',
    is2P: boolean = false
  ): Promise<number | null> {
    const templates = await this.getAvailableTimeSlots(date, deviceTypeId)
    
    const template = templates.find(t => 
      t.timeSlot.startHour === startHour && 
      t.timeSlot.endHour === endHour
    )

    if (!template) {
      return null
    }

    const hours = endHour - startHour
    return template.getPrice(creditType, hours, is2P)
  }

  /**
   * 청소년 이용 가능 시간대만 조회
   */
  async getYouthTimeSlots(
    date: Date,
    deviceTypeId: string
  ): Promise<TimeSlotTemplate[]> {
    const templates = await this.getAvailableTimeSlots(date, deviceTypeId)
    return templates.filter(t => t.isYouthTime)
  }
}