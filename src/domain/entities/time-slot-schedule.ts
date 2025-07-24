import { TimeSlotTemplate } from './time-slot-template'

export interface TimeSlotScheduleProps {
  id: string
  date: Date
  deviceTypeId: string
  deviceTypeName?: string
  templates: TimeSlotTemplate[]
  createdAt?: Date
  updatedAt?: Date
}

/**
 * 시간대 스케줄 엔티티
 * 특정 날짜의 기기별 시간대 구성을 관리합니다.
 */
export class TimeSlotSchedule {
  private constructor(
    public readonly id: string,
    private _date: Date,
    private _deviceTypeId: string,
    private _deviceTypeName: string | undefined,
    private _templates: TimeSlotTemplate[],
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {}

  static create(props: TimeSlotScheduleProps): TimeSlotSchedule {
    const now = new Date()
    
    // 검증
    if (!props.templates || props.templates.length === 0) {
      throw new Error('최소 하나 이상의 시간대 템플릿이 필요합니다')
    }

    // 날짜 검증 (과거 날짜 불가)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const scheduleDate = new Date(props.date)
    scheduleDate.setHours(0, 0, 0, 0)
    
    if (scheduleDate < today) {
      throw new Error('과거 날짜에 대한 스케줄은 설정할 수 없습니다')
    }

    // 시간대 중복 검증
    this.validateNoOverlaps(props.templates)

    return new TimeSlotSchedule(
      props.id,
      props.date,
      props.deviceTypeId,
      props.deviceTypeName,
      props.templates,
      props.createdAt || now,
      props.updatedAt || now
    )
  }

  private static validateNoOverlaps(templates: TimeSlotTemplate[]): void {
    const activeTemplates = templates.filter(t => t.isActive)
    
    for (let i = 0; i < activeTemplates.length; i++) {
      for (let j = i + 1; j < activeTemplates.length; j++) {
        if (activeTemplates[i].conflictsWith(activeTemplates[j])) {
          throw new Error(
            `시간대 중복: ${activeTemplates[i].name}와 ${activeTemplates[j].name}가 겹칩니다`
          )
        }
      }
    }
  }

  get date(): Date {
    return new Date(this._date)
  }

  get deviceTypeId(): string {
    return this._deviceTypeId
  }

  get deviceTypeName(): string | undefined {
    return this._deviceTypeName
  }

  get templates(): TimeSlotTemplate[] {
    return [...this._templates]
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt)
  }

  /**
   * 날짜를 YYYY-MM-DD 형식으로 반환
   */
  get dateString(): string {
    const year = this._date.getFullYear()
    const month = (this._date.getMonth() + 1).toString().padStart(2, '0')
    const day = this._date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /**
   * 활성화된 템플릿만 반환
   */
  get activeTemplates(): TimeSlotTemplate[] {
    return this._templates.filter(t => t.isActive)
  }

  /**
   * 조기대여 템플릿만 반환
   */
  get earlyTemplates(): TimeSlotTemplate[] {
    return this._templates.filter(t => t.type === 'early')
  }

  /**
   * 밤샘대여 템플릿만 반환
   */
  get overnightTemplates(): TimeSlotTemplate[] {
    return this._templates.filter(t => t.type === 'overnight')
  }

  /**
   * 템플릿 추가
   */
  addTemplate(template: TimeSlotTemplate): TimeSlotSchedule {
    // 중복 검증
    const newTemplates = [...this._templates, template]
    TimeSlotSchedule.validateNoOverlaps(newTemplates)

    return this.update({ templates: newTemplates })
  }

  /**
   * 템플릿 제거
   */
  removeTemplate(templateId: string): TimeSlotSchedule {
    const newTemplates = this._templates.filter(t => t.id !== templateId)
    
    if (newTemplates.length === 0) {
      throw new Error('최소 하나 이상의 시간대 템플릿이 필요합니다')
    }

    return this.update({ templates: newTemplates })
  }

  /**
   * 템플릿 교체
   */
  replaceTemplates(templates: TimeSlotTemplate[]): TimeSlotSchedule {
    if (!templates || templates.length === 0) {
      throw new Error('최소 하나 이상의 시간대 템플릿이 필요합니다')
    }

    TimeSlotSchedule.validateNoOverlaps(templates)
    return this.update({ templates })
  }

  /**
   * 특정 시간에 사용 가능한 템플릿 찾기
   */
  findAvailableTemplate(startHour: number, endHour: number): TimeSlotTemplate | null {
    return this.activeTemplates.find(template => {
      const timeSlot = template.timeSlot
      return timeSlot.startHour === startHour && timeSlot.endHour === endHour
    }) || null
  }

  /**
   * 특정 크레딧 타입으로 필터링
   */
  filterByCreditType(creditType: 'fixed' | 'freeplay' | 'unlimited'): TimeSlotTemplate[] {
    return this.activeTemplates.filter(template => 
      template.creditOptions.some(option => option.type === creditType)
    )
  }

  /**
   * 청소년 이용 가능한 템플릿만 반환
   */
  getYouthTemplates(): TimeSlotTemplate[] {
    return this.activeTemplates.filter(t => t.isYouthTime)
  }

  /**
   * 스케줄 업데이트
   */
  private update(props: Partial<Omit<TimeSlotScheduleProps, 'id' | 'createdAt'>>): TimeSlotSchedule {
    const updatedProps = {
      id: this.id,
      date: props.date ?? this._date,
      deviceTypeId: props.deviceTypeId ?? this._deviceTypeId,
      deviceTypeName: props.deviceTypeName !== undefined ? props.deviceTypeName : this._deviceTypeName,
      templates: props.templates ?? this._templates,
      createdAt: this.createdAt,
      updatedAt: new Date()
    }

    return TimeSlotSchedule.create(updatedProps)
  }

  /**
   * 동일한 날짜와 기기 타입인지 확인
   */
  isSameSchedule(date: Date, deviceTypeId: string): boolean {
    return this.dateString === this.formatDate(date) && this._deviceTypeId === deviceTypeId
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}