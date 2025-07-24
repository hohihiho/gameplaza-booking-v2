/**
 * AuthToken 값 객체
 * JWT 토큰을 래핑하여 도메인 레이어에서 사용
 */
export class AuthToken {
  private constructor(
    public readonly value: string,
    public readonly type: 'Bearer' = 'Bearer',
    private readonly _expiresAt: Date
  ) {
    this.validate()
  }

  /**
   * 토큰 생성
   */
  static create(token: string, expiresAt: Date): AuthToken {
    return new AuthToken(token, 'Bearer', expiresAt)
  }

  /**
   * 토큰 문자열에서 생성
   */
  static fromString(authHeader: string): AuthToken {
    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new Error('Invalid authorization header format')
    }
    
    // JWT 토큰의 만료 시간을 추출하려면 디코딩이 필요하지만,
    // 도메인 레이어에서는 JWT 라이브러리를 직접 사용하지 않음
    // 실제 검증은 인프라 레이어에서 수행
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 임시 24시간
    return new AuthToken(parts[1], 'Bearer', expiresAt)
  }

  /**
   * Authorization 헤더 형식으로 변환
   */
  toAuthorizationHeader(): string {
    return `${this.type} ${this.value}`
  }

  /**
   * 토큰 만료 여부 확인
   */
  isExpired(now: Date = new Date()): boolean {
    return this._expiresAt <= now
  }

  /**
   * 토큰 갱신 필요 여부 (만료 5분 전)
   */
  needsRefresh(now: Date = new Date()): boolean {
    const fiveMinutesBeforeExpiry = new Date(this._expiresAt.getTime() - 5 * 60 * 1000)
    return now >= fiveMinutesBeforeExpiry
  }

  /**
   * 만료 시간 반환
   */
  get expiresAt(): Date {
    return new Date(this._expiresAt)
  }

  /**
   * 남은 유효 시간 (초)
   */
  getSecondsUntilExpiry(now: Date = new Date()): number {
    return Math.max(0, Math.floor((this._expiresAt.getTime() - now.getTime()) / 1000))
  }

  /**
   * 토큰 유효성 검증
   */
  private validate(): void {
    if (!this.value || this.value.trim().length === 0) {
      throw new Error('Token value cannot be empty')
    }

    // JWT 형식 기본 검증 (header.payload.signature)
    const parts = this.value.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token format')
    }

    if (!this._expiresAt || isNaN(this._expiresAt.getTime())) {
      throw new Error('Invalid expiration date')
    }
  }

  /**
   * 동등성 비교
   */
  equals(other: AuthToken): boolean {
    return this.value === other.value && 
           this.type === other.type
  }
}