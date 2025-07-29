export type DeviceStatusType = 
  | 'available'     // 사용 가능
  | 'in_use'        // 사용 중
  | 'reserved'      // 예약됨
  | 'maintenance'   // 점검 중
  | 'broken'        // 고장

export class DeviceStatus {
  private constructor(
    private readonly _value: DeviceStatusType
  ) {}

  static available(): DeviceStatus {
    return new DeviceStatus('available')
  }

  static inUse(): DeviceStatus {
    return new DeviceStatus('in_use')
  }

  static reserved(): DeviceStatus {
    return new DeviceStatus('reserved')
  }

  static maintenance(): DeviceStatus {
    return new DeviceStatus('maintenance')
  }

  static broken(): DeviceStatus {
    return new DeviceStatus('broken')
  }

  static from(value: DeviceStatusType): DeviceStatus {
    const validStatuses: DeviceStatusType[] = ['available', 'in_use', 'reserved', 'maintenance', 'broken']
    if (!validStatuses.includes(value)) {
      throw new Error(`Invalid device status: ${value}`)
    }
    return new DeviceStatus(value)
  }

  get value(): DeviceStatusType {
    return this._value
  }

  /**
   * 사용 가능한 상태인지 확인
   */
  isAvailable(): boolean {
    return this._value === 'available'
  }

  /**
   * 사용 중인 상태인지 확인
   */
  isInUse(): boolean {
    return this._value === 'in_use'
  }

  /**
   * 예약된 상태인지 확인
   */
  isReserved(): boolean {
    return this._value === 'reserved'
  }

  /**
   * 운영 가능한 상태인지 확인 (사용가능, 사용중, 예약됨)
   */
  isOperational(): boolean {
    return this._value === 'available' || this._value === 'in_use' || this._value === 'reserved'
  }

  /**
   * 예약 불가능한 상태인지 확인 (점검중, 고장)
   */
  isUnavailable(): boolean {
    return this._value === 'maintenance' || this._value === 'broken'
  }

  /**
   * 상태 전환 가능 여부 확인
   */
  canTransitionTo(newStatus: DeviceStatusType): boolean {
    // 같은 상태로의 전환은 불허 (의미 없는 전환)
    if (this._value === newStatus) {
      return false
    }

    // 고장 상태에서는 점검 중으로만 전환 가능
    if (this._value === 'broken') {
      return newStatus === 'maintenance'
    }

    // 점검 중에서는 사용 가능으로만 전환 가능
    if (this._value === 'maintenance') {
      return newStatus === 'available'
    }

    // 사용 중에서는 사용 가능으로만 전환 가능
    if (this._value === 'in_use') {
      return newStatus === 'available'
    }

    // 예약됨에서는 사용 중 또는 사용 가능으로 전환 가능
    if (this._value === 'reserved') {
      return newStatus === 'in_use' || newStatus === 'available'
    }

    // 사용 가능에서는 예약됨, 사용중, 점검중, 고장으로 전환 가능
    if (this._value === 'available') {
      return ['reserved', 'in_use', 'maintenance', 'broken'].includes(newStatus)
    }

    return false
  }

  /**
   * 상태 전환
   */
  transitionTo(newStatus: DeviceStatusType): DeviceStatus {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(
        `기기 상태를 ${this.getDisplayName()}에서 ${DeviceStatus.from(newStatus).getDisplayName()}(으)로 변경할 수 없습니다`
      )
    }
    return DeviceStatus.from(newStatus)
  }

  /**
   * 상태 표시명 (한글)
   */
  getDisplayName(): string {
    const displayNames: Record<DeviceStatusType, string> = {
      available: '사용 가능',
      in_use: '사용 중',
      reserved: '예약됨',
      maintenance: '점검 중',
      broken: '고장'
    }
    return displayNames[this._value]
  }

  /**
   * 상태별 색상 코드 (UI용)
   */
  getColorCode(): string {
    const colors: Record<DeviceStatusType, string> = {
      available: '#10B981',    // 초록색
      in_use: '#3B82F6',      // 파란색
      reserved: '#F59E0B',    // 노란색
      maintenance: '#6B7280', // 회색
      broken: '#EF4444'       // 빨간색
    }
    return colors[this._value]
  }

  equals(other: DeviceStatus): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }
}