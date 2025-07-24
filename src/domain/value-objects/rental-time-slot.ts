import { v4 as uuidv4 } from 'uuid'

export type TimeSlotType = 'regular' | 'overnight' | 'maintenance' | 'special'

export interface RentalTimeSlotProps {
  id?: string
  dayOfWeek: number // 0-6 (일-토), -1은 매일
  startHour: number // 0-29 (24-29는 익일 0-5시)
  endHour: number   // 0-29
  type: TimeSlotType
  name?: string
  isActive?: boolean
}

/**
 * 대여 시간대 값 객체
 * 기기별 대여 가능 시간대를 관리
 */
export class RentalTimeSlot {
  public readonly id: string
  
  private constructor(
    id: string,
    private readonly _dayOfWeek: number,
    private readonly _startHour: number,
    private readonly _endHour: number,
    private readonly _type: TimeSlotType,
    private readonly _name: string | null,
    private readonly _isActive: boolean
  ) {
    this.id = id
  }

  static create(props: RentalTimeSlotProps): RentalTimeSlot {
    const id = props.id || uuidv4()

    // 유효성 검증
    if (props.dayOfWeek < -1 || props.dayOfWeek > 6) {
      throw new Error('요일은 -1(매일) 또는 0-6(일-토) 사이여야 합니다')
    }

    if (props.startHour < 0 || props.startHour > 29) {
      throw new Error('시작 시간은 0-29 사이여야 합니다')
    }

    if (props.endHour < 0 || props.endHour > 29) {
      throw new Error('종료 시간은 0-29 사이여야 합니다')
    }

    // 같은 날 내에서 시작이 종료보다 늦으면 자정을 넘는 것
    if (props.startHour >= props.endHour) {
      // 자정을 넘는 경우만 허용 (예: 22시-26시)
      const startDay = Math.floor(props.startHour / 24)
      const endDay = Math.floor(props.endHour / 24)
      if (startDay === endDay) {
        throw new Error('종료 시간은 시작 시간보다 늦어야 합니다')
      }
    }

    return new RentalTimeSlot(
      id,
      props.dayOfWeek,
      props.startHour,
      props.endHour,
      props.type,
      props.name || null,
      props.isActive !== false
    )
  }

  get dayOfWeek(): number {
    return this._dayOfWeek
  }

  get startHour(): number {
    return this._startHour
  }

  get endHour(): number {
    return this._endHour
  }

  get type(): TimeSlotType {
    return this._type
  }

  get name(): string | null {
    return this._name
  }

  get isActive(): boolean {
    return this._isActive
  }

  /**
   * 밤샘 시간대 여부
   */
  get isOvernight(): boolean {
    return this._type === 'overnight'
  }

  /**
   * 점검 시간대 여부
   */
  get isMaintenance(): boolean {
    return this._type === 'maintenance'
  }

  /**
   * 시간대 길이 (시간 단위)
   */
  get duration(): number {
    if (this._endHour > this._startHour) {
      return this._endHour - this._startHour
    }
    // 자정을 넘는 경우
    return (24 - this._startHour) + (this._endHour % 24)
  }

  /**
   * 요일 이름 표시
   */
  getDayName(): string {
    const days = ['일', '월', '화', '수', '목', '금', '토']
    return this._dayOfWeek === -1 ? '매일' : `${days[this._dayOfWeek]}요일`
  }

  /**
   * 시간 범위 표시 (예: "22시-26시")
   */
  getTimeRange(): string {
    return `${this._startHour}시-${this._endHour}시`
  }

  /**
   * 전체 표시명
   */
  getDisplayName(): string {
    if (this._name) {
      return this._name
    }
    return `${this.getDayName()} ${this.getTimeRange()}`
  }

  /**
   * 특정 시간이 이 시간대에 포함되는지 확인
   */
  containsHour(hour: number): boolean {
    if (!this._isActive) return false

    if (this._startHour < this._endHour) {
      // 같은 날 내의 범위
      return hour >= this._startHour && hour < this._endHour
    } else {
      // 자정을 넘는 범위
      return hour >= this._startHour || hour < this._endHour
    }
  }

  /**
   * 특정 요일과 시간에 대여 가능한지 확인
   */
  isAvailableAt(dayOfWeek: number, hour: number): boolean {
    if (!this._isActive) return false
    if (this._type === 'maintenance') return false

    // 요일 확인
    if (this._dayOfWeek !== -1 && this._dayOfWeek !== dayOfWeek) {
      return false
    }

    return this.containsHour(hour)
  }

  /**
   * 다른 시간대와 겹치는지 확인
   */
  overlapsWith(other: RentalTimeSlot): boolean {
    // 다른 요일이면 겹치지 않음
    if (this._dayOfWeek !== -1 && other._dayOfWeek !== -1 && 
        this._dayOfWeek !== other._dayOfWeek) {
      return false
    }

    // 시간 겹침 확인
    if (this._startHour < this._endHour && other._startHour < other._endHour) {
      // 둘 다 같은 날 내의 범위
      return !(this._endHour <= other._startHour || other._endHour <= this._startHour)
    } else {
      // 둘 중 하나가 자정을 넘는 경우 - 복잡한 계산이 필요
      return true
    }
  }

  /**
   * 동등성 비교
   */
  equals(other: RentalTimeSlot): boolean {
    return this._dayOfWeek === other._dayOfWeek &&
           this._startHour === other._startHour &&
           this._endHour === other._endHour &&
           this._type === other._type
  }

  toString(): string {
    const status = this._isActive ? '' : ' (비활성)'
    return `${this.getDisplayName()} [${this._type}]${status}`
  }
}