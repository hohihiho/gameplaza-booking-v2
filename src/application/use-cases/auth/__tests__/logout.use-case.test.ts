import { LogoutUseCase } from '../logout.use-case'
import { SessionRepository } from '@/src/domain/repositories/session-repository.interface'
import { Session } from '@/src/domain/entities/session'
import { AuthToken } from '@/src/domain/value-objects/auth-token'
import { LogoutRequestDto } from '@/src/application/dtos/auth.dto'

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase
  let mockSessionRepository: jest.Mocked<SessionRepository>

  beforeEach(() => {
    // Mock SessionRepository
    mockSessionRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findActiveByUserId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteByUserId: jest.fn(),
      findExpiredSessions: jest.fn(),
      findInactiveSessions: jest.fn(),
      deleteExpiredSessions: jest.fn(),
      countActiveSessionsByUserId: jest.fn(),
      findByUserIdAndDevice: jest.fn()
    }

    useCase = new LogoutUseCase(mockSessionRepository)
  })

  describe('단일 세션 로그아웃', () => {
    it('세션을 비활성화해야 한다', async () => {
      // Given
      const sessionId = 'session-123'
      const userId = 'user-123'
      
      // JWT 형식의 토큰 생성
      const mockJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6MTcwMDAwMDAwMH0.mock-signature'
      
      const activeSession = Session.createWithTokens(
        userId,
        AuthToken.create(mockJWT, new Date(Date.now() + 3600000)),
        AuthToken.create(mockJWT, new Date(Date.now() + 7 * 24 * 3600000)),
        {
          id: sessionId,
          isActive: true
        }
      )

      const deactivatedSession = activeSession.deactivate()

      mockSessionRepository.findById.mockResolvedValue(activeSession)
      mockSessionRepository.update.mockResolvedValue(deactivatedSession)

      // When
      const request: LogoutRequestDto = { sessionId }
      await useCase.execute(userId, request)

      // Then
      // execute는 void를 반환하므로 결과를 확인하지 않음
      expect(mockSessionRepository.findById).toHaveBeenCalledWith(sessionId)
      expect(mockSessionRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: sessionId,
          isActive: false
        })
      )
    })

    it('존재하지 않는 세션이면 오류를 던져야 한다', async () => {
      // Given
      const sessionId = 'non-existent-session'
      mockSessionRepository.findById.mockResolvedValue(null)

      // When & Then
      const request: LogoutRequestDto = { sessionId }
      await expect(useCase.execute('user-123', request))
        .rejects.toThrow('세션을 찾을 수 없습니다')
    })
  })

  describe('모든 디바이스 로그아웃', () => {
    it('사용자의 모든 활성 세션을 비활성화해야 한다', async () => {
      // Given
      const userId = 'user-123'
      
      const mockJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6MTcwMDAwMDAwMH0.mock-signature'
      
      const activeSessions = [
        Session.createWithTokens(
          userId,
          AuthToken.create(mockJWT, new Date(Date.now() + 3600000)),
          AuthToken.create(mockJWT, new Date(Date.now() + 7 * 24 * 3600000)),
          { id: 'session-1', isActive: true }
        ),
        Session.createWithTokens(
          userId,
          AuthToken.create(mockJWT, new Date(Date.now() + 3600000)),
          AuthToken.create(mockJWT, new Date(Date.now() + 7 * 24 * 3600000)),
          { id: 'session-2', isActive: true }
        )
      ]

      mockSessionRepository.findActiveByUserId.mockResolvedValue(activeSessions)
      mockSessionRepository.update.mockImplementation(session => 
        Promise.resolve(session.deactivate())
      )

      // When
      const request: LogoutRequestDto = { allDevices: true }
      await useCase.execute(userId, request)

      // Then
      // execute는 void를 반환하므로 동작만 확인
      expect(mockSessionRepository.findActiveByUserId).toHaveBeenCalledWith(userId)
      expect(mockSessionRepository.update).toHaveBeenCalledTimes(2)
    })

    it('활성 세션이 없으면 0을 반환해야 한다', async () => {
      // Given
      const userId = 'user-123'
      mockSessionRepository.findActiveByUserId.mockResolvedValue([])

      // When
      const request: LogoutRequestDto = { allDevices: true }
      await useCase.execute(userId, request)

      // Then
      expect(mockSessionRepository.findActiveByUserId).toHaveBeenCalledWith(userId)
      expect(mockSessionRepository.update).not.toHaveBeenCalled()
    })
  })
})