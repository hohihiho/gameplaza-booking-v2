import { TimeSlotTemplate, TimeSlotType } from '../entities/time-slot-template'

export interface TimeSlotTemplateFilters {
  type?: TimeSlotType
  isActive?: boolean
  isYouthTime?: boolean
  deviceTypeIds?: string[]
}

export interface TimeSlotTemplateRepository {
  /**
   * ID로 템플릿 조회
   */
  findById(id: string): Promise<TimeSlotTemplate | null>

  /**
   * 모든 템플릿 조회
   */
  findAll(filters?: TimeSlotTemplateFilters): Promise<TimeSlotTemplate[]>

  /**
   * 템플릿 저장 (생성 또는 수정)
   */
  save(template: TimeSlotTemplate): Promise<TimeSlotTemplate>

  /**
   * 여러 템플릿 일괄 저장
   */
  saveMany(templates: TimeSlotTemplate[]): Promise<TimeSlotTemplate[]>

  /**
   * 템플릿 삭제
   */
  delete(id: string): Promise<void>

  /**
   * 이름으로 템플릿 조회
   */
  findByName(name: string): Promise<TimeSlotTemplate | null>

  /**
   * 특정 시간대와 겹치는 활성 템플릿 조회
   */
  findConflicting(
    startHour: number, 
    endHour: number, 
    type: TimeSlotType,
    excludeId?: string
  ): Promise<TimeSlotTemplate[]>

  /**
   * 우선순위 순으로 정렬된 템플릿 조회
   */
  findByPriority(type?: TimeSlotType): Promise<TimeSlotTemplate[]>
}