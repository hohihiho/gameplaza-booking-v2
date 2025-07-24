import { User } from '../entities/user'
import { Session, DeviceInfo } from '../entities/session'
import { AuthToken } from '../value-objects/auth-token'

/**
 * JWT 페이로드 인터페이스
 */
export interface TokenPayload {
  sub: string // user id
  email: string
  role: string
  sessionId: string
  iat: number
  exp: number
}

/**
 * 토큰 생성 옵션
 */
export interface TokenOptions {
  expiresIn?: string // '1h', '7d' 등
  issuer?: string
  audience?: string
}

/**
 * 토큰 서비스 인터페이스 (인프라 레이어에서 구현)
 */
export interface ITokenService {
  generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>, options?: TokenOptions): Promise<string>
  verifyToken(token: string): Promise<TokenPayload>
  decodeToken(token: string): TokenPayload | null
}

/**
 * 인증 도메인 서비스
 * 인증 관련 비즈니스 로직 처리
 */
export class AuthDomainService {
  constructor(
    private readonly tokenService: ITokenService,
    private readonly defaultTokenExpiry: string = '24h',
    private readonly refreshTokenExpiry: string = '7d'
  ) {}

  /**
   * 사용자를 위한 액세스 토큰 생성
   */
  async createAccessToken(user: User, session: Session): Promise<AuthToken> {
    if (!user.canLogin()) {
      throw new Error('User cannot login')
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id
    }

    const tokenString = await this.tokenService.generateToken(payload, {
      expiresIn: this.defaultTokenExpiry
    })

    // 토큰 만료 시간 계산
    const expiresAt = this.calculateExpiry(this.defaultTokenExpiry)

    return AuthToken.create(tokenString, expiresAt)
  }

  /**
   * 리프레시 토큰 생성
   */
  async createRefreshToken(user: User, session: Session): Promise<AuthToken> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id
    }

    const tokenString = await this.tokenService.generateToken(payload, {
      expiresIn: this.refreshTokenExpiry
    })

    const expiresAt = this.calculateExpiry(this.refreshTokenExpiry)

    return AuthToken.create(tokenString, expiresAt)
  }

  /**
   * 토큰 검증 및 페이로드 추출
   */
  async verifyToken(token: AuthToken): Promise<TokenPayload> {
    if (token.isExpired()) {
      throw new Error('Token has expired')
    }

    try {
      return await this.tokenService.verifyToken(token.value)
    } catch (error) {
      throw new Error('Invalid token')
    }
  }

  /**
   * 세션 생성
   */
  createSession(
    user: User,
    token: AuthToken,
    deviceInfo?: DeviceInfo,
    ipAddress?: string,
    userAgent?: string
  ): Session {
    if (!user.canLogin()) {
      throw new Error('User cannot create session')
    }

    return Session.createWithToken(
      user.id,
      token,
      deviceInfo,
      ipAddress,
      userAgent
    )
  }

  /**
   * 세션 검증
   */
  validateSession(session: Session): boolean {
    if (session.isExpired()) {
      return false
    }

    // 30분 이상 비활성 상태면 무효
    if (session.getInactiveSeconds() > 30 * 60) {
      return false
    }

    return session.isActive
  }

  /**
   * 디바이스 정보 파싱
   */
  parseDeviceInfo(userAgent?: string): DeviceInfo {
    if (!userAgent) {
      return { type: 'unknown' }
    }

    // 간단한 디바이스 타입 감지
    const ua = userAgent.toLowerCase()
    
    let type: DeviceInfo['type'] = 'desktop'
    if (ua.includes('mobile')) {
      type = 'mobile'
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      type = 'tablet'
    }

    // OS 감지
    let os: string | undefined
    if (ua.includes('windows')) {
      os = 'Windows'
    } else if (ua.includes('mac')) {
      os = 'macOS'
    } else if (ua.includes('android')) {
      os = 'Android'
    } else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
      os = 'iOS'
    } else if (ua.includes('linux')) {
      os = 'Linux'
    }

    // 브라우저 감지
    let browser: string | undefined
    if (ua.includes('chrome')) {
      browser = 'Chrome'
    } else if (ua.includes('firefox')) {
      browser = 'Firefox'
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
      browser = 'Safari'
    } else if (ua.includes('edge')) {
      browser = 'Edge'
    }

    return { type, os, browser }
  }

  /**
   * 토큰 갱신 필요 여부 확인
   */
  shouldRefreshToken(token: AuthToken): boolean {
    return token.needsRefresh() && !token.isExpired()
  }

  /**
   * 만료 시간 계산
   */
  private calculateExpiry(duration: string): Date {
    const now = Date.now()
    const match = duration.match(/^(\d+)([hdmw])$/)
    
    if (!match) {
      throw new Error('Invalid duration format')
    }

    const value = parseInt(match[1])
    const unit = match[2]

    let milliseconds = 0
    switch (unit) {
      case 'h': // hours
        milliseconds = value * 60 * 60 * 1000
        break
      case 'd': // days
        milliseconds = value * 24 * 60 * 60 * 1000
        break
      case 'm': // minutes
        milliseconds = value * 60 * 1000
        break
      case 'w': // weeks
        milliseconds = value * 7 * 24 * 60 * 60 * 1000
        break
      default:
        throw new Error('Invalid duration unit')
    }

    return new Date(now + milliseconds)
  }

  /**
   * Google OAuth 사용자 처리
   */
  async handleGoogleAuth(
    googleProfile: {
      id: string
      email: string
      name: string
      picture?: string
    },
    existingUser: User | null,
    deviceInfo?: DeviceInfo,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ user: User; token: AuthToken; session: Session }> {
    let user: User

    if (existingUser) {
      // 기존 사용자에 Google 계정 연결
      if (!existingUser.googleId) {
        user = existingUser.linkGoogleAccount(googleProfile.id, googleProfile.picture)
      } else {
        user = existingUser.recordSuccessfulLogin()
      }
    } else {
      // 새 사용자 생성
      user = User.createFromGoogle(googleProfile)
    }

    // 토큰 생성 전 임시 세션 생성
    const tempSession = Session.create({
      id: `temp-${Date.now()}`,
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      deviceInfo: deviceInfo || this.parseDeviceInfo(userAgent),
      ipAddress,
      userAgent
    })

    // 토큰 생성
    const token = await this.createAccessToken(user, tempSession)

    // 실제 세션 생성
    const session = this.createSession(user, token, deviceInfo, ipAddress, userAgent)

    return { user, token, session }
  }
}