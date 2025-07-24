import { TimeSlot } from '../value-objects/time-slot'

export type TimeSlotType = 'early' | 'overnight'
export type CreditType = 'fixed' | 'freeplay' | 'unlimited'

export interface CreditOption {
  type: CreditType
  hours: number[]
  prices: Record<number, number> // hour -> price
  fixedCredits?: number // 고정크레딧인 경우 크레딧 수
}

export interface TimeSlotTemplateProps {
  id: string
  name: string
  description?: string
  type: TimeSlotType
  timeSlot: TimeSlot
  creditOptions: CreditOption[]
  enable2P: boolean
  price2PExtra?: number
  isYouthTime: boolean
  priority: number
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

/**
 * 시간대 템플릿 엔티티
 * 관리자가 설정하는 시간대 템플릿을 나타냅니다.
 */
export class TimeSlotTemplate {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | undefined,
    public readonly type: TimeSlotType,
    private _timeSlot: TimeSlot,
    private _creditOptions: CreditOption[],
    private _enable2P: boolean,
    private _price2PExtra: number | undefined,
    private _isYouthTime: boolean,
    private _priority: number,
    private _isActive: boolean,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {}

  static create(props: TimeSlotTemplateProps): TimeSlotTemplate {
    const now = new Date()
    
    // 검증
    this.validateCreditOptions(props.creditOptions)
    if (props.enable2P && (!props.price2PExtra || props.price2PExtra < 0)) {
      throw new Error('2인 플레이가 활성화된 경우 추가 요금을 설정해야 합니다')
    }

    // 청소년 시간대 검증 (9시-22시)
    if (props.isYouthTime) {
      const { normalizedStartHour, normalizedEndHour } = props.timeSlot
      const isValidYouthTime = 
        normalizedStartHour >= 9 && 
        normalizedEndHour <= 22 &&
        normalizedStartHour < normalizedEndHour
      
      if (!isValidYouthTime) {
        throw new Error('청소년 시간대는 오전 9시부터 오후 10시 사이여야 합니다')
      }
    }

    return new TimeSlotTemplate(
      props.id,
      props.name,
      props.description,
      props.type,
      props.timeSlot,
      props.creditOptions,
      props.enable2P,
      props.price2PExtra,
      props.isYouthTime,
      props.priority,
      props.isActive,
      props.createdAt || now,
      props.updatedAt || now
    )
  }

  private static validateCreditOptions(options: CreditOption[]): void {
    if (!options || options.length === 0) {
      throw new Error('최소 하나 이상의 크레딧 옵션이 필요합니다')
    }

    for (const option of options) {
      // 시간 검증
      if (!option.hours || option.hours.length === 0) {
        throw new Error('각 크레딧 옵션은 최소 하나 이상의 시간 옵션이 필요합니다')
      }

      // 가격 검증
      for (const hour of option.hours) {
        if (!option.prices[hour] || option.prices[hour] < 0) {
          throw new Error(`${hour}시간에 대한 가격이 설정되지 않았습니다`)
        }
      }

      // 고정크레딧 검증
      if (option.type === 'fixed' && (!option.fixedCredits || option.fixedCredits <= 0)) {
        throw new Error('고정크레딧 옵션은 크레딧 수를 설정해야 합니다')
      }
    }
  }

  get timeSlot(): TimeSlot {
    return this._timeSlot
  }

  get creditOptions(): CreditOption[] {
    return [...this._creditOptions]
  }

  get enable2P(): boolean {
    return this._enable2P
  }

  get price2PExtra(): number | undefined {
    return this._price2PExtra
  }

  get isYouthTime(): boolean {
    return this._isYouthTime
  }

  get priority(): number {
    return this._priority
  }

  get isActive(): boolean {
    return this._isActive
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  /**
   * 특정 크레딧 타입과 시간에 대한 가격 조회
   */
  getPrice(creditType: CreditType, hours: number, is2P: boolean = false): number | null {
    const option = this._creditOptions.find(opt => opt.type === creditType)
    if (!option) return null

    const basePrice = option.prices[hours]
    if (basePrice === undefined) return null

    const extra2P = is2P && this._enable2P && this._price2PExtra ? this._price2PExtra : 0
    return basePrice + extra2P
  }

  /**
   * 사용 가능한 시간 옵션 조회
   */
  getAvailableHours(creditType: CreditType): number[] {
    const option = this._creditOptions.find(opt => opt.type === creditType)
    return option ? [...option.hours].sort((a, b) => a - b) : []
  }

  /**
   * 특정 크레딧 타입의 고정 크레딧 수 조회
   */
  getFixedCredits(creditType: CreditType): number | null {
    if (creditType !== 'fixed') return null
    const option = this._creditOptions.find(opt => opt.type === creditType)
    return option?.fixedCredits || null
  }

  /**
   * 시간대 템플릿 업데이트
   */
  update(props: Partial<Omit<TimeSlotTemplateProps, 'id' | 'createdAt'>>): TimeSlotTemplate {
    const updatedProps = {
      id: this.id,
      name: props.name ?? this.name,
      description: props.description !== undefined ? props.description : this.description,
      type: props.type ?? this.type,
      timeSlot: props.timeSlot ?? this._timeSlot,
      creditOptions: props.creditOptions ?? this._creditOptions,
      enable2P: props.enable2P ?? this._enable2P,
      price2PExtra: props.price2PExtra !== undefined ? props.price2PExtra : this._price2PExtra,
      isYouthTime: props.isYouthTime ?? this._isYouthTime,
      priority: props.priority ?? this._priority,
      isActive: props.isActive ?? this._isActive,
      createdAt: this.createdAt,
      updatedAt: new Date()
    }

    return TimeSlotTemplate.create(updatedProps)
  }

  /**
   * 활성화/비활성화
   */
  toggleActive(): TimeSlotTemplate {
    return this.update({ isActive: !this._isActive })
  }

  /**
   * 다른 시간대 템플릿과 시간이 겹치는지 확인
   */
  conflictsWith(other: TimeSlotTemplate): boolean {
    if (this.id === other.id) return false
    if (this.type !== other.type) return false // 다른 타입끼리는 중복 가능
    if (!this._isActive || !other._isActive) return false
    return this._timeSlot.overlaps(other._timeSlot)
  }
}