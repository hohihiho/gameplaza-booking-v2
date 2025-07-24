import { RentalTimeSlot } from '../value-objects/rental-time-slot'
import { RentalPricing } from '../value-objects/rental-pricing'
import { RentalAvailability } from '../value-objects/rental-availability'

export interface RentalSettingsProps {
  id: string
  deviceTypeId: string
  timeSlots: RentalTimeSlot[]
  pricing: RentalPricing[]
  availability: RentalAvailability
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

/**
 * 대여 설정 엔티티
 * 기기별 대여 설정을 관리
 */
export class RentalSettings {
  private constructor(
    public readonly id: string,
    public readonly deviceTypeId: string,
    private _timeSlots: RentalTimeSlot[],
    private _pricing: RentalPricing[],
    private _availability: RentalAvailability,
    private _isActive: boolean,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {}

  static create(props: RentalSettingsProps): RentalSettings {
    const now = new Date()

    if (props.timeSlots.length === 0) {
      throw new Error('최소 하나의 시간대가 필요합니다')
    }

    if (props.pricing.length === 0) {
      throw new Error('최소 하나의 가격 설정이 필요합니다')
    }

    // 시간대 중복 검증
    const timeSlotsMap = new Map<string, RentalTimeSlot>()
    for (const slot of props.timeSlots) {
      const key = `${slot.dayOfWeek}-${slot.startHour}-${slot.endHour}`
      if (timeSlotsMap.has(key)) {
        throw new Error('중복된 시간대가 있습니다')
      }
      timeSlotsMap.set(key, slot)
    }

    return new RentalSettings(
      props.id,
      props.deviceTypeId,
      props.timeSlots,
      props.pricing,
      props.availability,
      props.isActive,
      props.createdAt || now,
      props.updatedAt || now
    )
  }

  get timeSlots(): RentalTimeSlot[] {
    return [...this._timeSlots]
  }

  get pricing(): RentalPricing[] {
    return [...this._pricing]
  }

  get availability(): RentalAvailability {
    return this._availability
  }

  get isActive(): boolean {
    return this._isActive
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  /**
   * 특정 시간에 대여 가능한지 확인
   */
  isAvailableAt(dayOfWeek: number, hour: number): boolean {
    if (!this._isActive) return false

    return this._timeSlots.some(slot => 
      slot.isAvailableAt(dayOfWeek, hour)
    )
  }

  /**
   * 특정 요일의 시간대 목록 조회
   */
  getTimeSlotsForDay(dayOfWeek: number): RentalTimeSlot[] {
    return this._timeSlots.filter(slot => 
      slot.dayOfWeek === dayOfWeek || slot.dayOfWeek === -1
    )
  }

  /**
   * 특정 시간대의 가격 계산
   */
  calculatePrice(
    dayOfWeek: number,
    startHour: number,
    endHour: number,
    playMode?: string,
    playerCount: number = 1
  ): number {
    // 먼저 해당 시간대가 대여 가능한지 확인
    let isTimeAvailable = false
    for (let hour = startHour; hour < endHour; hour++) {
      if (this.isAvailableAt(dayOfWeek, hour)) {
        isTimeAvailable = true
        break
      }
    }

    if (!isTimeAvailable) {
      throw new Error('해당 시간대에 적용 가능한 가격 설정을 찾을 수 없습니다')
    }

    // 해당 시간대에 적용 가능한 가격 정책 찾기
    const applicablePricing = this._pricing
      .filter(pricing => {
        // 시작 시간과 종료 시간 모두 적용 범위에 있는지 확인
        const startsInRange = pricing.appliesTo(dayOfWeek, startHour, playMode)
        const endsInRange = pricing.appliesTo(dayOfWeek, endHour - 1, playMode)
        return startsInRange || endsInRange
      })
      .sort((a, b) => b.priority - a.priority)[0]

    if (!applicablePricing) {
      throw new Error('해당 시간대에 적용 가능한 가격 설정을 찾을 수 없습니다')
    }

    return applicablePricing.calculatePrice(startHour, endHour, playerCount)
  }

  /**
   * 시간대 추가
   */
  addTimeSlot(timeSlot: RentalTimeSlot): RentalSettings {
    // 겹침 검증
    const isDuplicate = this._timeSlots.some(slot =>
      slot.overlapsWith(timeSlot)
    )

    if (isDuplicate) {
      throw new Error('겹치는 시간대가 있습니다')
    }

    return new RentalSettings(
      this.id,
      this.deviceTypeId,
      [...this._timeSlots, timeSlot],
      this._pricing,
      this._availability,
      this._isActive,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 시간대 제거
   */
  removeTimeSlot(timeSlotId: string): RentalSettings {
    const filtered = this._timeSlots.filter(slot => slot.id !== timeSlotId)
    
    if (filtered.length === 0) {
      throw new Error('최소 하나의 시간대가 필요합니다')
    }

    return new RentalSettings(
      this.id,
      this.deviceTypeId,
      filtered,
      this._pricing,
      this._availability,
      this._isActive,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 가격 설정 추가
   */
  addPricing(pricing: RentalPricing): RentalSettings {
    return new RentalSettings(
      this.id,
      this.deviceTypeId,
      this._timeSlots,
      [...this._pricing, pricing],
      this._availability,
      this._isActive,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 가격 설정 제거
   */
  removePricing(pricingId: string): RentalSettings {
    const filtered = this._pricing.filter(p => p.id !== pricingId)
    
    if (filtered.length === 0) {
      throw new Error('최소 하나의 가격 설정이 필요합니다')
    }

    return new RentalSettings(
      this.id,
      this.deviceTypeId,
      this._timeSlots,
      filtered,
      this._availability,
      this._isActive,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 가용성 설정 변경
   */
  updateAvailability(availability: RentalAvailability): RentalSettings {
    return new RentalSettings(
      this.id,
      this.deviceTypeId,
      this._timeSlots,
      this._pricing,
      availability,
      this._isActive,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 활성화/비활성화
   */
  toggleActive(): RentalSettings {
    return new RentalSettings(
      this.id,
      this.deviceTypeId,
      this._timeSlots,
      this._pricing,
      this._availability,
      !this._isActive,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 밤샘 시간대 보유 여부
   */
  hasOvernightSlot(): boolean {
    return this._timeSlots.some(slot => slot.isOvernight)
  }

  /**
   * 점검 시간대 보유 여부
   */
  hasMaintenanceSlot(): boolean {
    return this._timeSlots.some(slot => slot.isMaintenance)
  }

  equals(other: RentalSettings): boolean {
    return this.id === other.id
  }

  toString(): string {
    return `대여 설정 - ${this.deviceTypeId} (시간대: ${this._timeSlots.length}, 가격: ${this._pricing.length})`
  }
}