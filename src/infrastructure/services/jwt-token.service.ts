import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken'
import { ITokenService } from '@/src/domain/services/auth-domain.service'

/**
 * JWT 토큰 서비스 구현
 * JWT 토큰 생성, 검증, 디코드 기능 제공
 */
export class JWTTokenService implements ITokenService {
  constructor(
    private readonly accessTokenSecret: string,
    private readonly refreshTokenSecret: string,
    private readonly issuer: string = 'gameplaza-v2'
  ) {}

  /**
   * JWT 토큰 생성
   */
  async generateToken(
    payload: any, 
    options?: { expiresIn?: string; type?: 'access' | 'refresh' }
  ): Promise<string> {
    const tokenType = options?.type || 'access'
    const secret = tokenType === 'refresh' ? this.refreshTokenSecret : this.accessTokenSecret
    
    // 기본 옵션 설정
    const defaultOptions: SignOptions = {
      issuer: this.issuer,
      algorithm: 'HS256',
      expiresIn: tokenType === 'refresh' ? '7d' : '1h'
    }

    // 옵션 병합
    const finalOptions: SignOptions = {
      ...defaultOptions,
      ...options
    }

    // type 필드 제거 (SignOptions에 없는 필드)
    delete (finalOptions as any).type

    return new Promise((resolve, reject) => {
      jwt.sign(payload, secret, finalOptions, (err, token) => {
        if (err || !token) {
          reject(err || new Error('Failed to generate token'))
        } else {
          resolve(token)
        }
      })
    })
  }

  /**
   * JWT 토큰 검증
   */
  async verifyToken(
    token: string,
    options?: VerifyOptions & { type?: 'access' | 'refresh' }
  ): Promise<any> {
    const tokenType = options?.type || 'access'
    const secret = tokenType === 'refresh' ? this.refreshTokenSecret : this.accessTokenSecret
    
    // 기본 옵션 설정
    const defaultOptions: VerifyOptions = {
      issuer: this.issuer,
      algorithms: ['HS256']
    }

    // 옵션 병합
    const finalOptions: VerifyOptions = {
      ...defaultOptions,
      ...options
    }

    // type 필드 제거 (VerifyOptions에 없는 필드)
    delete (finalOptions as any).type

    return new Promise((resolve, reject) => {
      jwt.verify(token, secret, finalOptions, (err, decoded) => {
        if (err) {
          reject(err)
        } else {
          resolve(decoded)
        }
      })
    })
  }

  /**
   * JWT 토큰 디코드 (검증 없이)
   */
  decodeToken(token: string): any {
    return jwt.decode(token)
  }

  /**
   * 액세스 토큰 생성
   */
  async generateAccessToken(
    userId: string,
    email: string,
    role: string,
    sessionId: string
  ): Promise<string> {
    const payload = {
      sub: userId,
      email,
      role,
      sessionId,
      type: 'access'
    }

    return this.generateToken(payload, {
      type: 'access',
      expiresIn: '1h'
    })
  }

  /**
   * 리프레시 토큰 생성
   */
  async generateRefreshToken(
    userId: string,
    sessionId: string
  ): Promise<string> {
    const payload = {
      sub: userId,
      sessionId,
      type: 'refresh'
    }

    return this.generateToken(payload, {
      type: 'refresh',
      expiresIn: '7d'
    })
  }

  /**
   * 액세스 토큰 검증
   */
  async verifyAccessToken(token: string): Promise<{
    sub: string
    email: string
    role: string
    sessionId: string
    iat: number
    exp: number
  }> {
    const decoded = await this.verifyToken(token, { type: 'access' })
    
    if (!decoded.sub || !decoded.email || !decoded.role || !decoded.sessionId) {
      throw new Error('Invalid access token payload')
    }

    return decoded
  }

  /**
   * 리프레시 토큰 검증
   */
  async verifyRefreshToken(token: string): Promise<{
    sub: string
    sessionId: string
    iat: number
    exp: number
  }> {
    const decoded = await this.verifyToken(token, { type: 'refresh' })
    
    if (!decoded.sub || !decoded.sessionId) {
      throw new Error('Invalid refresh token payload')
    }

    return decoded
  }

  /**
   * 토큰 만료 시간 추출
   */
  getTokenExpiry(token: string): Date | null {
    const decoded = this.decodeToken(token)
    
    if (decoded && typeof decoded.exp === 'number') {
      return new Date(decoded.exp * 1000)
    }

    return null
  }

  /**
   * 토큰 발급 시간 추출
   */
  getTokenIssuedAt(token: string): Date | null {
    const decoded = this.decodeToken(token)
    
    if (decoded && typeof decoded.iat === 'number') {
      return new Date(decoded.iat * 1000)
    }

    return null
  }
}