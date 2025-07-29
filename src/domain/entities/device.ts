import { DeviceStatus, DeviceStatusType } from '../value-objects/device-status'

export interface DeviceProps {
  id: string
  deviceTypeId: string
  deviceNumber: string
  status?: DeviceStatus | string  // 문자열도 받을 수 있도록 수정
  notes?: string | null
  location?: string | null
  serialNumber?: string | null
  purchaseDate?: Date | null
  lastMaintenanceDate?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

export class Device {
  private constructor(
    public readonly id: string,
    public readonly deviceTypeId: string,
    public readonly deviceNumber: string,
    private _status: DeviceStatus,
    private _notes: string | null,
    private _location: string | null,
    private _serialNumber: string | null,
    private _purchaseDate: Date | null,
    private _lastMaintenanceDate: Date | null,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {}

  static create(props: DeviceProps): Device {
    const now = new Date()
    
    // status가 문자열인 경우 DeviceStatus 객체로 변환
    let status: DeviceStatus
    if (typeof props.status === 'string') {
      status = DeviceStatus.from(props.status as DeviceStatusType)
    } else if (props.status instanceof DeviceStatus) {
      status = props.status
    } else {
      status = DeviceStatus.available()
    }
    
    return new Device(
      props.id,
      props.deviceTypeId,
      props.deviceNumber,
      status,
      props.notes || null,
      props.location || null,
      props.serialNumber || null,
      props.purchaseDate || null,
      props.lastMaintenanceDate || null,
      props.createdAt || now,
      props.updatedAt || now
    )
  }

  get status(): DeviceStatus {
    return this._status
  }

  get notes(): string | null {
    return this._notes
  }

  get location(): string | null {
    return this._location
  }

  get serialNumber(): string | null {
    return this._serialNumber
  }

  get purchaseDate(): Date | null {
    return this._purchaseDate
  }

  get lastMaintenanceDate(): Date | null {
    return this._lastMaintenanceDate
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  get displayName(): string {
    return this.deviceNumber
  }

  /**
   * 기기가 예약 가능한 상태인지 확인
   */
  canBeReserved(): boolean {
    return this._status.isAvailable()
  }

  /**
   * 기기가 사용 가능한 상태인지 확인
   */
  isAvailable(): boolean {
    return this._status.isAvailable()
  }

  /**
   * 기기가 예약된 상태인지 확인
   */
  isReserved(): boolean {
    return this._status.value === 'reserved'
  }

  /**
   * 기기가 운영 가능한 상태인지 확인 (사용 가능하거나 예약됨)
   */
  isOperational(): boolean {
    return ['available', 'reserved', 'in_use'].includes(this._status.value)
  }

  /**
   * 기기 상태 변경
   */
  changeStatus(newStatusType: DeviceStatusType, notes?: string): Device {
    const newStatus = this._status.transitionTo(newStatusType)
    
    return new Device(
      this.id,
      this.deviceTypeId,
      this.deviceNumber,
      newStatus,
      notes || this._notes,
      this._location,
      this._serialNumber,
      this._purchaseDate,
      newStatusType === 'available' && this._status.value === 'maintenance' 
        ? new Date() 
        : this._lastMaintenanceDate,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 사용 시작 (체크인)
   */
  startUsing(): Device {
    return this.changeStatus('in_use')
  }

  /**
   * 사용 종료
   */
  endUsing(): Device {
    return this.changeStatus('available')
  }

  /**
   * 예약으로 상태 변경
   */
  reserve(): Device {
    return this.changeStatus('reserved')
  }

  /**
   * 예약 해제
   */
  release(): Device {
    return this.changeStatus('available')
  }

  /**
   * 점검 시작
   */
  startMaintenance(notes: string): Device {
    return this.changeStatus('maintenance', notes)
  }

  /**
   * 점검 완료
   */
  endMaintenance(): Device {
    return this.changeStatus('available', '점검 완료')
  }

  /**
   * 고장 처리
   */
  markAsBroken(reason: string): Device {
    return this.changeStatus('broken', reason)
  }

  /**
   * 위치 변경
   */
  changeLocation(newLocation: string): Device {
    return new Device(
      this.id,
      this.deviceTypeId,
      this.deviceNumber,
      this._status,
      this._notes,
      newLocation,
      this._serialNumber,
      this._purchaseDate,
      this._lastMaintenanceDate,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 메모 업데이트
   */
  updateNotes(notes: string | null): Device {
    return new Device(
      this.id,
      this.deviceTypeId,
      this.deviceNumber,
      this._status,
      notes,
      this._location,
      this._serialNumber,
      this._purchaseDate,
      this._lastMaintenanceDate,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 시리얼 번호 업데이트
   */
  updateSerialNumber(serialNumber: string): Device {
    return new Device(
      this.id,
      this.deviceTypeId,
      this.deviceNumber,
      this._status,
      this._notes,
      this._location,
      serialNumber,
      this._purchaseDate,
      this._lastMaintenanceDate,
      this.createdAt,
      new Date()
    )
  }
}

/**
 * 기기 카테고리 (최상위 분류)
 */
export interface DeviceCategoryProps {
  id: string
  name: string
  description?: string
  displayOrder: number
  createdAt?: Date
}

export class DeviceCategory {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly displayOrder: number,
    public readonly createdAt: Date
  ) {}

  static create(props: DeviceCategoryProps): DeviceCategory {
    return new DeviceCategory(
      props.id,
      props.name,
      props.description || null,
      props.displayOrder,
      props.createdAt || new Date()
    )
  }
}

/**
 * 기기 유형 (중간 분류)
 */
export interface DeviceTypeProps {
  id: string
  categoryId: string
  name: string
  description?: string
  specifications?: Record<string, any>
  hourlyRate: number
  maxReservationHours: number
  createdAt?: Date
}

export class DeviceType {
  private constructor(
    public readonly id: string,
    public readonly categoryId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly specifications: Record<string, any>,
    public readonly hourlyRate: number,
    public readonly maxReservationHours: number,
    public readonly createdAt: Date
  ) {}

  static create(props: DeviceTypeProps): DeviceType {
    return new DeviceType(
      props.id,
      props.categoryId,
      props.name,
      props.description || null,
      props.specifications || {},
      props.hourlyRate,
      props.maxReservationHours,
      props.createdAt || new Date()
    )
  }

  calculatePrice(hours: number): number {
    if (hours > this.maxReservationHours) {
      throw new Error(`Maximum reservation hours is ${this.maxReservationHours}`)
    }
    return this.hourlyRate * hours
  }
}