import { OAuth2Client } from 'google-auth-library'
import { IGoogleAuthService } from '@/src/application/use-cases/auth/google-auth.use-case'
import { GoogleProfileDto } from '@/src/application/dtos/auth.dto'

/**
 * Google OAuth 서비스 구현
 * Google ID 토큰 검증 및 프로필 정보 추출
 */
export class GoogleAuthService implements IGoogleAuthService {
  private client: OAuth2Client

  constructor(
    private readonly clientId: string,
    private readonly clientSecret?: string
  ) {
    this.client = new OAuth2Client({
      clientId: this.clientId,
      clientSecret: this.clientSecret
    })
  }

  /**
   * Google ID 토큰 검증 및 프로필 정보 추출
   */
  async verifyIdToken(idToken: string): Promise<GoogleProfileDto> {
    try {
      // ID 토큰 검증
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.clientId
      })

      const payload = ticket.getPayload()
      
      if (!payload) {
        throw new Error('Invalid token payload')
      }

      // 필수 필드 확인
      if (!payload.sub || !payload.email) {
        throw new Error('Missing required fields in token')
      }

      // 프로필 DTO 생성
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture,
        email_verified: payload.email_verified || false
      }
    } catch (error) {
      // Google 검증 실패
      if (error instanceof Error) {
        throw new Error(`Google authentication failed: ${error.message}`)
      }
      throw new Error('Google authentication failed')
    }
  }

  /**
   * 액세스 토큰으로 사용자 정보 조회 (선택적)
   */
  async getUserInfo(accessToken: string): Promise<GoogleProfileDto> {
    try {
      // Google People API를 통한 사용자 정보 조회
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user info')
      }

      const data = await response.json()

      return {
        id: data.id,
        email: data.email,
        name: data.name || data.email.split('@')[0],
        picture: data.picture,
        email_verified: data.verified_email || false
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get user info: ${error.message}`)
      }
      throw new Error('Failed to get user info')
    }
  }

  /**
   * 클라이언트 구성 업데이트 (테스트용)
   */
  updateClientConfig(clientId: string, clientSecret?: string): void {
    this.client = new OAuth2Client({
      clientId,
      clientSecret
    })
  }

  /**
   * 리디렉션 URL 생성 (웹 플로우용)
   */
  generateAuthUrl(redirectUri: string, state?: string): string {
    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'openid',
        'email',
        'profile'
      ],
      redirect_uri: redirectUri,
      state
    })
  }

  /**
   * 인증 코드를 토큰으로 교환 (웹 플로우용)
   */
  async getTokenFromCode(code: string, redirectUri: string): Promise<{
    idToken: string
    accessToken: string
    refreshToken?: string
  }> {
    try {
      const { tokens } = await this.client.getToken({
        code,
        redirect_uri: redirectUri
      })

      if (!tokens.id_token || !tokens.access_token) {
        throw new Error('Missing tokens in response')
      }

      return {
        idToken: tokens.id_token,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to exchange code for tokens: ${error.message}`)
      }
      throw new Error('Failed to exchange code for tokens')
    }
  }
}