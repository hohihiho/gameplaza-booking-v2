export interface RentalAvailabilityProps {
  totalUnits: number           // 총 유닛
  minUnitsAvailable?: number   // 최소 가용 유닛
  maxUnitsPerReservation?: number  // 최대 예약 유닛
  bufferUnits?: number         // 버퍼 (정비 대비)
}

/**
 * 대여 가용성 설정 값 객체
 * 기기별 대여 가능 유닛과 제한을 관리
 */
export class RentalAvailability {
  private constructor(
    private readonly _totalUnits: number,
    private readonly _minUnitsAvailable: number,
    private readonly _maxUnitsPerReservation: number,
    private readonly _bufferUnits: number
  ) {}

  static create(props: RentalAvailabilityProps): RentalAvailability {
    if (props.totalUnits < 1) {
      throw new Error('총 유닛은 1개 이상이어야 합니다')
    }

    const minUnitsAvailable = props.minUnitsAvailable ?? 1
    const maxUnitsPerReservation = props.maxUnitsPerReservation ?? props.totalUnits
    const bufferUnits = props.bufferUnits ?? 0

    if (minUnitsAvailable < 0) {
      throw new Error('최소 가용 유닛은 0개 이상이어야 합니다')
    }

    if (minUnitsAvailable > props.totalUnits) {
      throw new Error('최소 가용 유닛은 총 유닛보다 클 수 없습니다')
    }

    if (maxUnitsPerReservation < 1) {
      throw new Error('최대 예약 유닛은 1개 이상이어야 합니다')
    }

    if (maxUnitsPerReservation > props.totalUnits) {
      throw new Error('최대 예약 유닛은 총 유닛보다 클 수 없습니다')
    }

    if (bufferUnits < 0) {
      throw new Error('버퍼는 0개 이상이어야 합니다')
    }

    if (bufferUnits >= props.totalUnits) {
      throw new Error('버퍼는 총 유닛보다 작아야 합니다')
    }

    return new RentalAvailability(
      props.totalUnits,
      minUnitsAvailable,
      maxUnitsPerReservation,
      bufferUnits
    )
  }

  get totalUnits(): number {
    return this._totalUnits
  }

  get minUnitsAvailable(): number {
    return this._minUnitsAvailable
  }

  get maxUnitsPerReservation(): number {
    return this._maxUnitsPerReservation
  }

  get bufferUnits(): number {
    return this._bufferUnits
  }

  /**
   * 실제 대여 가능한 최대 유닛
   */
  get maxRentableUnits(): number {
    return Math.max(0, this._totalUnits - this._bufferUnits)
  }

  /**
   * 특정 수량의 대여 가능 여부 확인
   */
  canRent(requestedUnits: number, currentlyRented: number): boolean {
    // 요청 수량이 최대 예약 유닛을 초과하는지 확인
    if (requestedUnits > this._maxUnitsPerReservation) {
      return false
    }

    // 현재 가용 가능한 유닛을 버퍼를 고려해서 계산
    const availableUnits = this._totalUnits - currentlyRented - this._bufferUnits
    
    // 요청한 수량이 가용 유닛보다 많으면 불가
    if (requestedUnits > availableUnits) {
      return false
    }
    
    // 최소 가용 유닛 보장 확인 (대여 후 남는 전체 유닛으로 계산)
    const totalRemainingAfterRent = this._totalUnits - currentlyRented - requestedUnits
    if (totalRemainingAfterRent < this._minUnitsAvailable) {
      return false
    }

    return true
  }

  /**
   * 대여 가능한 최대 유닛 계산
   */
  getMaxRentableUnits(currentlyRented: number): number {
    const availableUnits = this._totalUnits - currentlyRented - this._bufferUnits
    const maxByPolicy = Math.min(availableUnits, this._maxUnitsPerReservation)
    
    // 최소 가용 유닛을 보장하면서 대여 가능한 수
    const maxWhileMaintainingMin = Math.max(0, availableUnits - this._minUnitsAvailable)
    
    return Math.min(maxByPolicy, maxWhileMaintainingMin)
  }

  /**
   * 요약 정보
   */
  getSummary(): string {
    const parts = [`총 ${this._totalUnits}대`]
    
    if (this._bufferUnits > 0) {
      parts.push(`버퍼 ${this._bufferUnits}대`)
    }
    
    if (this._minUnitsAvailable > 1) {
      parts.push(`최소 보장 ${this._minUnitsAvailable}대`)
    }
    
    if (this._maxUnitsPerReservation < this._totalUnits) {
      parts.push(`최대 예약 ${this._maxUnitsPerReservation}대`)
    }
    
    return parts.join(', ')
  }

  equals(other: RentalAvailability): boolean {
    return this._totalUnits === other._totalUnits &&
           this._minUnitsAvailable === other._minUnitsAvailable &&
           this._maxUnitsPerReservation === other._maxUnitsPerReservation &&
           this._bufferUnits === other._bufferUnits
  }

  toString(): string {
    return this.getSummary()
  }
}