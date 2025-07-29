import { AuthToken } from '@/src/domain/value-objects/auth-token'
import { AuthDomainService } from '@/src/domain/services/auth-domain.service'
import { UserRepository } from '@/src/domain/repositories/user-repository.interface'
import { SessionRepository } from '@/src/domain/repositories/session-repository.interface'
import { 
  RefreshTokenRequestDto, 
  RefreshTokenResponseDto 
} from '../../dtos/auth.dto'

/**
 * 토큰 갱신 유스케이스
 * 리프레시 토큰으로 새로운 액세스 토큰 발급
 */
export class RefreshTokenUseCase {
  constructor(
    private readonly authDomainService: AuthDomainService,
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository
  ) {}

  /**
   * 토큰 갱신 실행
   */
  async execute(request: RefreshTokenRequestDto): Promise<RefreshTokenResponseDto> {
    // 1. 리프레시 토큰 검증
    const refreshToken = AuthToken.create(
      request.refreshToken,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 임시 만료 시간
    )

    let payload
    try {
      payload = await this.authDomainService.verifyToken(refreshToken)
    } catch (error) {
      if (error instanceof Error && error.message.includes('expired')) {
        throw new Error('토큰이 만료되었습니다')
      }
      throw new Error('유효하지 않은 리프레시 토큰입니다')
    }

    // 2. 세션 조회 및 검증
    const session = await this.sessionRepository.findById(payload.sessionId)
    if (!session) {
      throw new Error('세션을 찾을 수 없습니다')
    }

    if (!session.isActive) {
      throw new Error('세션이 비활성화되었습니다')
    }

    if (!this.authDomainService.validateSession(session)) {
      throw new Error('세션이 만료되었거나 유효하지 않습니다')
    }

    // 3. 사용자 조회
    const user = await this.userRepository.findById(payload.sub)
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다')
    }

    if (!user.canLogin()) {
      if (user.status === 'suspended') {
        throw new Error('계정이 정지되었습니다')
      }
      throw new Error('로그인할 수 없는 사용자입니다')
    }

    // 4. 세션 활동 업데이트
    const updatedSession = session.updateActivity()
    await this.sessionRepository.update(updatedSession)

    // 5. 새로운 액세스 토큰 생성
    const newAccessToken = await this.authDomainService.createAccessToken(user, updatedSession)

    // 6. 리프레시 토큰 갱신 필요 여부 확인
    let newRefreshToken: AuthToken | undefined
    if (this.authDomainService.shouldRefreshToken(refreshToken)) {
      newRefreshToken = await this.authDomainService.createRefreshToken(user, updatedSession)
    }

    // 7. 응답 생성
    return {
      accessToken: newAccessToken.value,
      refreshToken: newRefreshToken?.value,
      expiresIn: newAccessToken.getSecondsUntilExpiry(),
      tokenType: newAccessToken.type
    }
  }
}