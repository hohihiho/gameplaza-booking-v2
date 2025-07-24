/**
 * 기기 플레이 모드 타입
 */
export type PlayModeType = 
  | 'standard'      // 스탠다드 모드
  | 'dx'           // DX 모드
  | 'single'       // 1인 플레이
  | 'versus'       // 대전 모드
  | 'coop'         // 협동 모드
  | 'freeplay'     // 프리플레이
  | 'credit'       // 크레딧 모드
  | 'session'      // 세션 모드
  | 'tournament'   // 토너먼트 모드
  | 'practice'     // 연습 모드

/**
 * 플레이 모드별 옵션
 */
export interface PlayModeOptions {
  maxPlayers: number           // 최대 플레이어 수
  minPlayers?: number          // 최소 플레이어 수
  requiresMultipleDevices?: boolean  // 여러 기기 필요 여부
  creditPerPlay?: number       // 플레이당 크레딧
  sessionMinutes?: number      // 세션 시간(분)
  description?: string         // 모드 설명
}

export interface DevicePlayModeProps {
  mode: PlayModeType
  options: PlayModeOptions
  isDefault?: boolean
  displayOrder: number
}

/**
 * 기기 플레이 모드 값 객체
 */
export class DevicePlayMode {
  private constructor(
    private readonly _mode: PlayModeType,
    private readonly _options: PlayModeOptions,
    private readonly _isDefault: boolean,
    private readonly _displayOrder: number
  ) {}

  static create(props: DevicePlayModeProps): DevicePlayMode {
    // 유효성 검증
    if (props.options.maxPlayers < 1) {
      throw new Error('최대 플레이어 수는 1명 이상이어야 합니다')
    }

    if (props.options.minPlayers && props.options.minPlayers > props.options.maxPlayers) {
      throw new Error('최소 플레이어 수는 최대 플레이어 수보다 클 수 없습니다')
    }

    if (props.options.creditPerPlay && props.options.creditPerPlay < 0) {
      throw new Error('크레딧은 0 이상이어야 합니다')
    }

    if (props.options.sessionMinutes && props.options.sessionMinutes < 1) {
      throw new Error('세션 시간은 1분 이상이어야 합니다')
    }

    return new DevicePlayMode(
      props.mode,
      props.options,
      props.isDefault || false,
      props.displayOrder
    )
  }

  get mode(): PlayModeType {
    return this._mode
  }

  get options(): PlayModeOptions {
    return { ...this._options }
  }

  get isDefault(): boolean {
    return this._isDefault
  }

  get displayOrder(): number {
    return this._displayOrder
  }

  get maxPlayers(): number {
    return this._options.maxPlayers
  }

  get minPlayers(): number {
    return this._options.minPlayers || 1
  }

  /**
   * 플레이 모드 표시명 (한글)
   */
  getDisplayName(): string {
    const displayNames: Record<PlayModeType, string> = {
      standard: '스탠다드',
      dx: 'DX 모드',
      single: '싱글 플레이',
      versus: '대전 모드',
      coop: '협동 플레이',
      freeplay: '프리플레이',
      credit: '크레딧 모드',
      session: '세션 모드',
      tournament: '토너먼트',
      practice: '연습 모드'
    }
    return displayNames[this._mode]
  }

  /**
   * 주어진 플레이어 수로 플레이 가능한지 확인
   */
  canPlayWith(playerCount: number): boolean {
    return playerCount >= this.minPlayers && playerCount <= this.maxPlayers
  }

  /**
   * 다른 기기가 필요한지 확인
   */
  requiresMultipleDevices(): boolean {
    return this._options.requiresMultipleDevices || false
  }

  /**
   * 플레이 요금 계산
   */
  calculateCost(playerCount: number, hours: number): number {
    if (!this.canPlayWith(playerCount)) {
      throw new Error(`${playerCount}명으로는 ${this.getDisplayName()} 모드를 플레이할 수 없습니다`)
    }

    // 세션 기반 모드는 시간 단위로 계산
    if (this._options.sessionMinutes) {
      const sessions = Math.ceil((hours * 60) / this._options.sessionMinutes)
      return sessions * (this._options.creditPerPlay || 0) * playerCount
    }

    // 크레딧 기반 모드
    if (this._options.creditPerPlay) {
      return this._options.creditPerPlay * playerCount
    }

    // 기본 시간제 요금 (부모 엔티티에서 처리)
    return 0
  }

  /**
   * 기본 모드로 설정
   */
  setAsDefault(): DevicePlayMode {
    return new DevicePlayMode(
      this._mode,
      this._options,
      true,
      this._displayOrder
    )
  }

  /**
   * 기본 모드 해제
   */
  unsetAsDefault(): DevicePlayMode {
    return new DevicePlayMode(
      this._mode,
      this._options,
      false,
      this._displayOrder
    )
  }

  /**
   * 표시 순서 변경
   */
  changeOrder(newOrder: number): DevicePlayMode {
    return new DevicePlayMode(
      this._mode,
      this._options,
      this._isDefault,
      newOrder
    )
  }

  equals(other: DevicePlayMode): boolean {
    return this._mode === other._mode && 
           this._options.maxPlayers === other._options.maxPlayers &&
           this._options.minPlayers === other._options.minPlayers
  }

  toString(): string {
    return `${this.getDisplayName()} (${this.minPlayers}-${this.maxPlayers}인)`
  }
}