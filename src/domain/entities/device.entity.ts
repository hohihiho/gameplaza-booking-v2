/**
 * 기기(Device) 엔티티
 */
export type DeviceType = 'desktop' | 'laptop' | 'game_console'
export type DeviceStatus = 'active' | 'maintenance' | 'inactive' | 'in_use'

export interface DeviceProps {
  id: string
  deviceNumber: string
  name: string
  type: DeviceType
  status: DeviceStatus
  specifications?: string
  notes?: string
  createdAt?: Date
  updatedAt?: Date
}

export class Device {
  private constructor(
    public readonly id: string,
    public readonly deviceNumber: string,
    public readonly name: string,
    public readonly type: DeviceType,
    private _status: DeviceStatus,
    public readonly specifications: string | null,
    public readonly notes: string | null,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {}

  static create(props: DeviceProps): Device {
    const now = new Date()
    
    return new Device(
      props.id,
      props.deviceNumber,
      props.name,
      props.type,
      props.status,
      props.specifications || null,
      props.notes || null,
      props.createdAt || now,
      props.updatedAt || now
    )
  }

  get status(): DeviceStatus {
    return this._status
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  /**
   * 기기가 활성 상태인지 확인
   */
  isActive(): boolean {
    return this._status === 'active'
  }

  /**
   * 기기가 점검 중인지 확인
   */
  isUnderMaintenance(): boolean {
    return this._status === 'maintenance'
  }

  /**
   * 기기 상태 변경
   */
  changeStatus(newStatus: DeviceStatus): Device {
    return new Device(
      this.id,
      this.deviceNumber,
      this.name,
      this.type,
      newStatus,
      this.specifications,
      this.notes,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 기기 활성화
   */
  activate(): Device {
    return this.changeStatus('active')
  }

  /**
   * 기기 비활성화
   */
  deactivate(): Device {
    return this.changeStatus('inactive')
  }

  /**
   * 점검 모드로 전환
   */
  setMaintenance(): Device {
    return this.changeStatus('maintenance')
  }

  /**
   * 기기 정보 업데이트
   */
  update(props: Partial<Omit<DeviceProps, 'id' | 'createdAt'>>): Device {
    return new Device(
      this.id,
      props.deviceNumber || this.deviceNumber,
      props.name || this.name,
      props.type || this.type,
      props.status || this._status,
      props.specifications !== undefined ? props.specifications || null : this.specifications,
      props.notes !== undefined ? props.notes || null : this.notes,
      this.createdAt,
      new Date()
    )
  }
}