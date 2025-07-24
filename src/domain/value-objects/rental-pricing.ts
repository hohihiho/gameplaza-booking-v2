import { v4 as uuidv4 } from 'uuid'

export type PricingType = 'hourly' | 'flat' | 'session' | 'dynamic'

export interface RentalPricingProps {
  id?: string
  name: string
  type: PricingType
  basePrice: number
  // 적용 조건
  dayOfWeek?: number[] // 요일 (숫자로 표현, 0=일)
  startHour?: number   // 시작 시간
  endHour?: number     // 종료 시간
  // 플레이 모드 조건
  playMode?: string    // 플레이 모드명
  // 가격 옵션
  perPlayerPrice?: number     // 인당 추가 가격
  minPrice?: number          // 최소 가격
  maxPrice?: number          // 최대 가격
  sessionMinutes?: number    // 세션 시간 (세션 기반 가격)
  priority: number           // 우선순위 (높을수록 우선 적용)
}

/**
 * 대여 가격 정책 값 객체
 * 요일, 시간대별 유연한 가격 설정
 */
export class RentalPricing {
  public readonly id: string

  private constructor(
    id: string,
    private readonly _name: string,
    private readonly _type: PricingType,
    private readonly _basePrice: number,
    private readonly _dayOfWeek: number[],
    private readonly _startHour: number | null,
    private readonly _endHour: number | null,
    private readonly _playMode: string | null,
    private readonly _perPlayerPrice: number,
    private readonly _minPrice: number | null,
    private readonly _maxPrice: number | null,
    private readonly _sessionMinutes: number | null,
    private readonly _priority: number
  ) {
    this.id = id
  }

  static create(props: RentalPricingProps): RentalPricing {
    const id = props.id || uuidv4()

    if (props.basePrice < 0) {
      throw new Error('기본 가격은 0원 이상이어야 합니다')
    }

    if (props.perPlayerPrice && props.perPlayerPrice < 0) {
      throw new Error('인당 추가 가격은 0원 이상이어야 합니다')
    }

    if (props.minPrice && props.maxPrice && props.minPrice > props.maxPrice) {
      throw new Error('최소 가격은 최대 가격보다 클 수 없습니다')
    }

    if (props.type === 'session' && !props.sessionMinutes) {
      throw new Error('세션 기반 가격은 세션 시간이 필요합니다')
    }

    return new RentalPricing(
      id,
      props.name,
      props.type,
      props.basePrice,
      props.dayOfWeek || [],
      props.startHour ?? null,
      props.endHour ?? null,
      props.playMode || null,
      props.perPlayerPrice || 0,
      props.minPrice ?? null,
      props.maxPrice ?? null,
      props.sessionMinutes || null,
      props.priority
    )
  }

  get name(): string {
    return this._name
  }

  get type(): PricingType {
    return this._type
  }

  get basePrice(): number {
    return this._basePrice
  }

  get priority(): number {
    return this._priority
  }

  /**
   * 특정 조건에 이 가격 정책이 적용되는지 확인
   */
  appliesTo(dayOfWeek: number, hour: number, playMode?: string): boolean {
    // 요일 확인
    if (this._dayOfWeek.length > 0 && !this._dayOfWeek.includes(dayOfWeek)) {
      return false
    }

    // 시간 확인
    if (this._startHour !== null && this._endHour !== null) {
      if (this._startHour < this._endHour) {
        // 같은 날 내의 범위
        if (hour < this._startHour || hour >= this._endHour) {
          return false
        }
      } else {
        // 자정을 넘는 범위
        if (hour < this._startHour && hour >= this._endHour) {
          return false
        }
      }
    }

    // 플레이 모드 확인
    if (this._playMode && playMode !== this._playMode) {
      return false
    }

    return true
  }

  /**
   * 가격 계산
   */
  calculatePrice(startHour: number, endHour: number, playerCount: number = 1): number {
    let totalPrice = 0
    const hours = this.calculateHours(startHour, endHour)

    switch (this._type) {
      case 'hourly':
        // 시간당 가격
        totalPrice = this._basePrice * hours
        break

      case 'flat':
        // 정액 가격
        totalPrice = this._basePrice
        break

      case 'session':
        // 세션 기반 가격
        if (this._sessionMinutes) {
          const sessions = Math.ceil((hours * 60) / this._sessionMinutes)
          totalPrice = this._basePrice * sessions
        }
        break

      case 'dynamic':
        // 동적 가격 (기본 시간당으로 계산, 추후 로직 확장)
        totalPrice = this._basePrice * hours
        break
    }

    // 인당 추가 가격
    if (playerCount > 1 && this._perPlayerPrice > 0) {
      totalPrice += this._perPlayerPrice * (playerCount - 1)
    }

    // 최소/최대 가격 적용
    if (this._minPrice !== null) {
      totalPrice = Math.max(totalPrice, this._minPrice)
    }
    if (this._maxPrice !== null) {
      totalPrice = Math.min(totalPrice, this._maxPrice)
    }

    return Math.round(totalPrice)
  }

  /**
   * 시간 계산 (24시간 이후 처리 포함)
   */
  private calculateHours(startHour: number, endHour: number): number {
    if (endHour > startHour) {
      return endHour - startHour
    }
    // 자정을 넘는 경우
    return (24 - startHour) + (endHour % 24)
  }

  /**
   * 가격 설정 설명
   */
  getDescription(): string {
    const parts = [this._name]

    // 요일 조건
    if (this._dayOfWeek.length > 0) {
      const days = ['일', '월', '화', '수', '목', '금', '토']
      const dayNames = this._dayOfWeek.map(d => days[d]).join(', ')
      parts.push(`(${dayNames})`)
    }

    // 시간 조건
    if (this._startHour !== null && this._endHour !== null) {
      parts.push(`${this._startHour}시-${this._endHour}시`)
    }

    // 플레이 모드 조건
    if (this._playMode) {
      parts.push(`[${this._playMode}]`)
    }

    // 가격 유형
    switch (this._type) {
      case 'hourly':
        parts.push(`시간당 ${this._basePrice.toLocaleString()}원`)
        break
      case 'flat':
        parts.push(`정액 ${this._basePrice.toLocaleString()}원`)
        break
      case 'session':
        parts.push(`${this._sessionMinutes}분당 ${this._basePrice.toLocaleString()}원`)
        break
    }

    return parts.join(' ')
  }

  equals(other: RentalPricing): boolean {
    return this.id === other.id
  }

  toString(): string {
    return this.getDescription()
  }
}