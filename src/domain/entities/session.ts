import { AuthToken } from '../value-objects/auth-token'

export interface SessionProps {
  id: string
  userId: string
  deviceInfo?: DeviceInfo
  ipAddress?: string
  userAgent?: string
  createdAt?: Date
  expiresAt: Date
  lastActivityAt?: Date
  isActive?: boolean
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop' | 'unknown'
  os?: string
  browser?: string
}

/**
 * Session 엔티티
 * 사용자의 로그인 세션을 관리
 */
export class Session {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    private _deviceInfo: DeviceInfo | undefined,
    private _ipAddress: string | undefined,
    private _userAgent: string | undefined,
    public readonly createdAt: Date,
    private _expiresAt: Date,
    private _lastActivityAt: Date,
    private _isActive: boolean
  ) {}

  /**
   * 새로운 세션 생성
   */
  static create(props: SessionProps): Session {
    const now = new Date()
    
    return new Session(
      props.id,
      props.userId,
      props.deviceInfo,
      props.ipAddress,
      props.userAgent,
      props.createdAt || now,
      props.expiresAt,
      props.lastActivityAt || now,
      props.isActive !== false
    )
  }

  /**
   * 토큰과 함께 세션 생성
   */
  static createWithToken(
    userId: string,
    token: AuthToken,
    deviceInfo?: DeviceInfo,
    ipAddress?: string,
    userAgent?: string
  ): Session {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    return Session.create({
      id: sessionId,
      userId,
      deviceInfo,
      ipAddress,
      userAgent,
      expiresAt: token.expiresAt
    })
  }

  get deviceInfo(): DeviceInfo | undefined {
    return this._deviceInfo
  }

  get ipAddress(): string | undefined {
    return this._ipAddress
  }

  get userAgent(): string | undefined {
    return this._userAgent
  }

  get expiresAt(): Date {
    return new Date(this._expiresAt)
  }

  get lastActivityAt(): Date {
    return new Date(this._lastActivityAt)
  }

  get isActive(): boolean {
    return this._isActive
  }

  /**
   * 세션 만료 여부 확인
   */
  isExpired(now: Date = new Date()): boolean {
    return this._expiresAt <= now || !this._isActive
  }

  /**
   * 세션 갱신 필요 여부 (만료 30분 전)
   */
  needsRefresh(now: Date = new Date()): boolean {
    const thirtyMinutesBeforeExpiry = new Date(this._expiresAt.getTime() - 30 * 60 * 1000)
    return now >= thirtyMinutesBeforeExpiry
  }

  /**
   * 세션 비활성 시간 (초)
   */
  getInactiveSeconds(now: Date = new Date()): number {
    return Math.floor((now.getTime() - this._lastActivityAt.getTime()) / 1000)
  }

  /**
   * 세션 활동 업데이트
   */
  updateActivity(now: Date = new Date()): Session {
    return new Session(
      this.id,
      this.userId,
      this._deviceInfo,
      this._ipAddress,
      this._userAgent,
      this.createdAt,
      this._expiresAt,
      now,
      this._isActive
    )
  }

  /**
   * 세션 만료 시간 연장
   */
  extend(additionalMinutes: number): Session {
    const newExpiresAt = new Date(this._expiresAt.getTime() + additionalMinutes * 60 * 1000)
    
    return new Session(
      this.id,
      this.userId,
      this._deviceInfo,
      this._ipAddress,
      this._userAgent,
      this.createdAt,
      newExpiresAt,
      this._lastActivityAt,
      this._isActive
    )
  }

  /**
   * 세션 비활성화 (로그아웃)
   */
  deactivate(): Session {
    return new Session(
      this.id,
      this.userId,
      this._deviceInfo,
      this._ipAddress,
      this._userAgent,
      this.createdAt,
      this._expiresAt,
      this._lastActivityAt,
      false
    )
  }

  /**
   * 세션 정보 업데이트
   */
  updateInfo(
    deviceInfo?: DeviceInfo,
    ipAddress?: string,
    userAgent?: string
  ): Session {
    return new Session(
      this.id,
      this.userId,
      deviceInfo || this._deviceInfo,
      ipAddress || this._ipAddress,
      userAgent || this._userAgent,
      this.createdAt,
      this._expiresAt,
      this._lastActivityAt,
      this._isActive
    )
  }

  /**
   * 모바일 디바이스 여부
   */
  isMobileDevice(): boolean {
    return this._deviceInfo?.type === 'mobile' || this._deviceInfo?.type === 'tablet'
  }

  /**
   * 동일 디바이스 여부 확인
   */
  isSameDevice(deviceInfo?: DeviceInfo, userAgent?: string): boolean {
    if (!this._deviceInfo || !deviceInfo) return false
    
    return this._deviceInfo.type === deviceInfo.type &&
           this._deviceInfo.os === deviceInfo.os &&
           this._deviceInfo.browser === deviceInfo.browser &&
           this._userAgent === userAgent
  }
}