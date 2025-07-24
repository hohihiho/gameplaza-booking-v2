import { TimeSlotSchedule } from '../entities/time-slot-schedule'

export interface TimeSlotScheduleFilters {
  startDate?: Date
  endDate?: Date
  deviceTypeId?: string
  deviceTypeIds?: string[]
}

export interface TimeSlotScheduleRepository {
  /**
   * ID로 스케줄 조회
   */
  findById(id: string): Promise<TimeSlotSchedule | null>

  /**
   * 특정 날짜와 기기 타입으로 스케줄 조회
   */
  findByDateAndDeviceType(date: Date, deviceTypeId: string): Promise<TimeSlotSchedule | null>

  /**
   * 날짜 범위로 스케줄 조회
   */
  findByDateRange(filters: TimeSlotScheduleFilters): Promise<TimeSlotSchedule[]>

  /**
   * 스케줄 저장 (생성 또는 수정)
   */
  save(schedule: TimeSlotSchedule): Promise<TimeSlotSchedule>

  /**
   * 여러 스케줄 일괄 저장
   */
  saveMany(schedules: TimeSlotSchedule[]): Promise<TimeSlotSchedule[]>

  /**
   * 스케줄 삭제
   */
  delete(id: string): Promise<void>

  /**
   * 날짜와 기기 타입으로 스케줄 삭제
   */
  deleteByDateAndDeviceType(date: Date, deviceTypeId: string): Promise<void>

  /**
   * 날짜 범위의 스케줄 삭제
   */
  deleteByDateRange(
    startDate: Date, 
    endDate: Date, 
    deviceTypeId?: string
  ): Promise<number>

  /**
   * 특정 템플릿을 사용하는 스케줄 조회
   */
  findByTemplateId(templateId: string): Promise<TimeSlotSchedule[]>

  /**
   * 오늘 이후의 모든 스케줄 조회
   */
  findFutureSchedules(deviceTypeId?: string): Promise<TimeSlotSchedule[]>
}