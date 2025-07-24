import { SessionRepository } from '@/src/domain/repositories/session-repository.interface'
import { LogoutRequestDto } from '../../dtos/auth.dto'

/**
 * 로그아웃 유스케이스
 * 세션 종료 처리
 */
export class LogoutUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository
  ) {}

  /**
   * 로그아웃 실행
   */
  async execute(userId: string, request: LogoutRequestDto): Promise<void> {
    if (request.allDevices) {
      // 모든 디바이스에서 로그아웃
      await this.logoutAllDevices(userId)
    } else if (request.sessionId) {
      // 특정 세션만 로그아웃
      await this.logoutSession(userId, request.sessionId)
    } else {
      throw new Error('세션 ID를 제공하거나 allDevices 옵션을 사용해주세요')
    }
  }

  /**
   * 특정 세션 로그아웃
   */
  private async logoutSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId)
    
    if (!session) {
      throw new Error('세션을 찾을 수 없습니다')
    }

    if (session.userId !== userId) {
      throw new Error('권한이 없습니다')
    }

    // 세션 비활성화
    const deactivatedSession = session.deactivate()
    await this.sessionRepository.update(deactivatedSession)
  }

  /**
   * 모든 디바이스에서 로그아웃
   */
  private async logoutAllDevices(userId: string): Promise<void> {
    // 사용자의 모든 활성 세션 조회
    const activeSessions = await this.sessionRepository.findActiveByUserId(userId)

    // 모든 세션 비활성화
    const deactivationPromises = activeSessions.map(async (session) => {
      const deactivatedSession = session.deactivate()
      return this.sessionRepository.update(deactivatedSession)
    })

    await Promise.all(deactivationPromises)
  }
}