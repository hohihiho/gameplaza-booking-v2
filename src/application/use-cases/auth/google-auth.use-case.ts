import { User } from '@/src/domain/entities/user'
import { Session } from '@/src/domain/entities/session'
import { AuthToken } from '@/src/domain/value-objects/auth-token'
import { AuthDomainService } from '@/src/domain/services/auth-domain.service'
import { UserRepository } from '@/src/domain/repositories/user-repository.interface'
import { SessionRepository } from '@/src/domain/repositories/session-repository.interface'
import { 
  GoogleProfileDto, 
  AuthRequestDto, 
  AuthResponseDto,
  AuthUserDto,
  AuthSessionDto
} from '../../dtos/auth.dto'

/**
 * Google OAuth 프로필 검증 서비스 인터페이스
 */
export interface IGoogleAuthService {
  verifyIdToken(idToken: string): Promise<GoogleProfileDto>
}

/**
 * Google OAuth 인증 유스케이스
 * Google 로그인/회원가입 처리
 */
export class GoogleAuthUseCase {
  constructor(
    private readonly googleAuthService: IGoogleAuthService,
    private readonly authDomainService: AuthDomainService,
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository
  ) {}

  /**
   * Google OAuth 로그인/회원가입 실행
   */
  async execute(request: AuthRequestDto): Promise<AuthResponseDto> {
    // 1. Google ID 토큰 검증
    const googleProfile = await this.verifyGoogleToken(request.googleIdToken)

    // 2. 기존 사용자 조회
    const existingUser = await this.findExistingUser(googleProfile)

    // 3. 디바이스 정보 파싱
    const deviceInfo = request.deviceInfo || this.authDomainService.parseDeviceInfo(request.userAgent)

    // 4. Google OAuth 처리 (사용자 생성/업데이트, 토큰 생성, 세션 생성)
    const { user, token, session } = await this.authDomainService.handleGoogleAuth(
      googleProfile,
      existingUser,
      deviceInfo,
      request.ipAddress,
      request.userAgent
    )

    // 5. 사용자 저장/업데이트
    const savedUser = await this.saveUser(user, existingUser === null)

    // 6. 세션 저장
    const savedSession = await this.sessionRepository.save(session)

    // 7. 리프레시 토큰 생성
    const refreshToken = await this.authDomainService.createRefreshToken(savedUser, savedSession)

    // 8. 응답 생성
    return this.createAuthResponse(
      savedUser,
      token,
      refreshToken,
      savedSession,
      existingUser === null
    )
  }

  /**
   * Google ID 토큰 검증
   */
  private async verifyGoogleToken(idToken: string): Promise<GoogleProfileDto> {
    try {
      const profile = await this.googleAuthService.verifyIdToken(idToken)
      
      if (!profile.email_verified) {
        throw new Error('이메일 인증이 필요합니다')
      }

      return profile
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Google 인증 실패: ${error.message}`)
      }
      throw new Error('Google 인증 실패')
    }
  }

  /**
   * 기존 사용자 조회
   */
  private async findExistingUser(googleProfile: GoogleProfileDto): Promise<User | null> {
    // 1. Google ID로 조회
    const userByGoogleId = await this.userRepository.findByGoogleId(googleProfile.id)
    if (userByGoogleId) {
      return userByGoogleId
    }

    // 2. 이메일로 조회 (Google 계정 연동 안 된 경우)
    const userByEmail = await this.userRepository.findByEmail(googleProfile.email)
    if (userByEmail) {
      return userByEmail
    }

    return null
  }

  /**
   * 사용자 저장/업데이트
   */
  private async saveUser(user: User, isNewUser: boolean): Promise<User> {
    if (isNewUser) {
      return await this.userRepository.save(user)
    } else {
      return await this.userRepository.update(user)
    }
  }

  /**
   * 인증 응답 생성
   */
  private createAuthResponse(
    user: User,
    accessToken: AuthToken,
    refreshToken: AuthToken,
    session: Session,
    isNewUser: boolean
  ): AuthResponseDto {
    const authUser: AuthUserDto = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      status: user.status,
      profileImageUrl: user.profileImageUrl,
      isNewUser
    }

    const authSession: AuthSessionDto = {
      id: session.id,
      deviceType: session.deviceInfo?.type,
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString()
    }

    return {
      accessToken: accessToken.value,
      refreshToken: refreshToken.value,
      expiresIn: accessToken.getSecondsUntilExpiry(),
      tokenType: accessToken.type,
      user: authUser,
      session: authSession
    }
  }
}