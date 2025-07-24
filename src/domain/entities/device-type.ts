import { DevicePlayMode, DevicePlayModeProps } from '../value-objects/device-play-mode'

export interface DeviceTypeProps {
  id: string
  categoryId: string
  name: string
  manufacturer?: string
  model?: string
  description?: string
  specifications?: Record<string, any>
  defaultHourlyRate: number
  maxReservationHours: number
  minReservationHours?: number
  supportsCreditPlay?: boolean
  supportsMultiPlayer?: boolean
  playModes?: DevicePlayMode[]
  displayOrder: number
  isActive?: boolean
  imageUrl?: string
  createdAt?: Date
  updatedAt?: Date
}

/**
 * 기기 타입 (중간 분류)
 * 예: 마이마이DX, 사운드볼텍스, 철권8 등
 */
export class DeviceType {
  private constructor(
    public readonly id: string,
    public readonly categoryId: string,
    private _name: string,
    private _manufacturer: string | null,
    private _model: string | null,
    private _description: string | null,
    private _specifications: Record<string, any>,
    private _defaultHourlyRate: number,
    private _maxReservationHours: number,
    private _minReservationHours: number,
    private _supportsCreditPlay: boolean,
    private _supportsMultiPlayer: boolean,
    private _playModes: DevicePlayMode[],
    private _displayOrder: number,
    private _isActive: boolean,
    private _imageUrl: string | null,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {}

  static create(props: DeviceTypeProps): DeviceType {
    const now = new Date()

    if (!props.name || props.name.trim().length === 0) {
      throw new Error('기종 이름은 필수입니다')
    }

    if (props.defaultHourlyRate < 0) {
      throw new Error('시간당 요금은 0원 이상이어야 합니다')
    }

    if (props.maxReservationHours < 1) {
      throw new Error('최대 예약 시간은 1시간 이상이어야 합니다')
    }

    const minHours = props.minReservationHours || 1
    if (minHours > props.maxReservationHours) {
      throw new Error('최소 예약 시간은 최대 예약 시간보다 클 수 없습니다')
    }

    if (props.displayOrder < 0) {
      throw new Error('표시 순서는 0 이상이어야 합니다')
    }

    // 플레이 모드 검증
    const playModes = props.playModes || []
    const defaultModes = playModes.filter(mode => mode.isDefault)
    if (defaultModes.length > 1) {
      throw new Error('기본 플레이 모드는 하나만 설정할 수 있습니다')
    }

    return new DeviceType(
      props.id,
      props.categoryId,
      props.name.trim(),
      props.manufacturer?.trim() || null,
      props.model?.trim() || null,
      props.description?.trim() || null,
      props.specifications || {},
      props.defaultHourlyRate,
      props.maxReservationHours,
      minHours,
      props.supportsCreditPlay || false,
      props.supportsMultiPlayer || false,
      playModes,
      props.displayOrder,
      props.isActive !== false,
      props.imageUrl || null,
      props.createdAt || now,
      props.updatedAt || now
    )
  }

  get name(): string {
    return this._name
  }

  get manufacturer(): string | null {
    return this._manufacturer
  }

  get model(): string | null {
    return this._model
  }

  get description(): string | null {
    return this._description
  }

  get specifications(): Record<string, any> {
    return { ...this._specifications }
  }

  get defaultHourlyRate(): number {
    return this._defaultHourlyRate
  }

  get maxReservationHours(): number {
    return this._maxReservationHours
  }

  get minReservationHours(): number {
    return this._minReservationHours
  }

  get supportsCreditPlay(): boolean {
    return this._supportsCreditPlay
  }

  get supportsMultiPlayer(): boolean {
    return this._supportsMultiPlayer
  }

  get playModes(): DevicePlayMode[] {
    return [...this._playModes]
  }

  get displayOrder(): number {
    return this._displayOrder
  }

  get isActive(): boolean {
    return this._isActive
  }

  get imageUrl(): string | null {
    return this._imageUrl
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  /**
   * 전체 표시명 (제조사 + 모델명 포함)
   */
  get fullName(): string {
    const parts = [this._name]
    if (this._manufacturer) parts.push(`(${this._manufacturer})`)
    if (this._model) parts.push(this._model)
    return parts.join(' ')
  }

  /**
   * 기본 플레이 모드 가져오기
   */
  get defaultPlayMode(): DevicePlayMode | null {
    return this._playModes.find(mode => mode.isDefault) || this._playModes[0] || null
  }

  /**
   * 예약 시간에 대한 요금 계산
   */
  calculatePrice(hours: number, playMode?: DevicePlayMode, playerCount: number = 1): number {
    if (hours < this._minReservationHours || hours > this._maxReservationHours) {
      throw new Error(
        `예약 시간은 ${this._minReservationHours}시간에서 ${this._maxReservationHours}시간 사이여야 합니다`
      )
    }

    // 플레이 모드가 지정되지 않으면 기본 모드 사용
    const mode = playMode || this.defaultPlayMode

    // 플레이 모드별 요금 계산
    if (mode) {
      const modeCost = mode.calculateCost(playerCount, hours)
      if (modeCost > 0) {
        return modeCost
      }
    }

    // 기본 시간제 요금
    return this._defaultHourlyRate * hours * playerCount
  }

  /**
   * 플레이 모드 추가
   */
  addPlayMode(modeProps: DevicePlayModeProps): DeviceType {
    const newMode = DevicePlayMode.create(modeProps)
    
    // 중복 검사
    if (this._playModes.some(mode => mode.equals(newMode))) {
      throw new Error('이미 동일한 플레이 모드가 존재합니다')
    }

    // 기본 모드 검사
    if (newMode.isDefault && this._playModes.some(mode => mode.isDefault)) {
      throw new Error('기본 플레이 모드는 하나만 설정할 수 있습니다')
    }

    return new DeviceType(
      this.id,
      this.categoryId,
      this._name,
      this._manufacturer,
      this._model,
      this._description,
      this._specifications,
      this._defaultHourlyRate,
      this._maxReservationHours,
      this._minReservationHours,
      this._supportsCreditPlay,
      this._supportsMultiPlayer,
      [...this._playModes, newMode],
      this._displayOrder,
      this._isActive,
      this._imageUrl,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 플레이 모드 제거
   */
  removePlayMode(mode: DevicePlayMode): DeviceType {
    const filteredModes = this._playModes.filter(m => !m.equals(mode))
    
    if (filteredModes.length === this._playModes.length) {
      throw new Error('해당 플레이 모드를 찾을 수 없습니다')
    }

    return new DeviceType(
      this.id,
      this.categoryId,
      this._name,
      this._manufacturer,
      this._model,
      this._description,
      this._specifications,
      this._defaultHourlyRate,
      this._maxReservationHours,
      this._minReservationHours,
      this._supportsCreditPlay,
      this._supportsMultiPlayer,
      filteredModes,
      this._displayOrder,
      this._isActive,
      this._imageUrl,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 기본 플레이 모드 설정
   */
  setDefaultPlayMode(mode: DevicePlayMode): DeviceType {
    if (!this._playModes.some(m => m.equals(mode))) {
      throw new Error('존재하지 않는 플레이 모드입니다')
    }

    const updatedModes = this._playModes.map(m => {
      if (m.equals(mode)) {
        return m.setAsDefault()
      } else if (m.isDefault) {
        return m.unsetAsDefault()
      }
      return m
    })

    return new DeviceType(
      this.id,
      this.categoryId,
      this._name,
      this._manufacturer,
      this._model,
      this._description,
      this._specifications,
      this._defaultHourlyRate,
      this._maxReservationHours,
      this._minReservationHours,
      this._supportsCreditPlay,
      this._supportsMultiPlayer,
      updatedModes,
      this._displayOrder,
      this._isActive,
      this._imageUrl,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 기본 시간당 요금 변경
   */
  changeHourlyRate(newRate: number): DeviceType {
    if (newRate < 0) {
      throw new Error('시간당 요금은 0원 이상이어야 합니다')
    }

    return new DeviceType(
      this.id,
      this.categoryId,
      this._name,
      this._manufacturer,
      this._model,
      this._description,
      this._specifications,
      newRate,
      this._maxReservationHours,
      this._minReservationHours,
      this._supportsCreditPlay,
      this._supportsMultiPlayer,
      this._playModes,
      this._displayOrder,
      this._isActive,
      this._imageUrl,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 예약 시간 제한 변경
   */
  changeReservationLimits(minHours: number, maxHours: number): DeviceType {
    if (minHours < 1) {
      throw new Error('최소 예약 시간은 1시간 이상이어야 합니다')
    }

    if (maxHours < minHours) {
      throw new Error('최대 예약 시간은 최소 예약 시간보다 커야 합니다')
    }

    return new DeviceType(
      this.id,
      this.categoryId,
      this._name,
      this._manufacturer,
      this._model,
      this._description,
      this._specifications,
      this._defaultHourlyRate,
      maxHours,
      minHours,
      this._supportsCreditPlay,
      this._supportsMultiPlayer,
      this._playModes,
      this._displayOrder,
      this._isActive,
      this._imageUrl,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 활성화/비활성화
   */
  toggleActive(): DeviceType {
    return new DeviceType(
      this.id,
      this.categoryId,
      this._name,
      this._manufacturer,
      this._model,
      this._description,
      this._specifications,
      this._defaultHourlyRate,
      this._maxReservationHours,
      this._minReservationHours,
      this._supportsCreditPlay,
      this._supportsMultiPlayer,
      this._playModes,
      this._displayOrder,
      !this._isActive,
      this._imageUrl,
      this.createdAt,
      new Date()
    )
  }

  equals(other: DeviceType): boolean {
    return this.id === other.id
  }

  toString(): string {
    return `${this.fullName}${this._isActive ? '' : ' (비활성)'}`
  }
}