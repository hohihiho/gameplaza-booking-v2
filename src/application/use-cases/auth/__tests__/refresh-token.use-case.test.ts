import { RefreshTokenUseCase } from '../refresh-token.use-case'
import { AuthDomainService, ITokenService } from '@/src/domain/services/auth-domain.service'
import { UserRepository } from '@/src/domain/repositories/user-repository.interface'
import { SessionRepository } from '@/src/domain/repositories/session-repository.interface'
import { User } from '@/src/domain/entities/user'
import { Session } from '@/src/domain/entities/session'
import { AuthToken } from '@/src/domain/value-objects/auth-token'
import { RefreshTokenRequestDto } from '@/src/application/dtos/auth.dto'

describe('RefreshTokenUseCase - Unit Tests', () => {
  let useCase: RefreshTokenUseCase
  let mockAuthDomainService: jest.Mocked<AuthDomainService>
  let mockUserRepository: jest.Mocked<UserRepository>
  let mockSessionRepository: jest.Mocked<SessionRepository>

  beforeEach(() => {
    // Mock token service
    const mockTokenService: jest.Mocked<ITokenService> = {
      generateToken: jest.fn(),
      verifyToken: jest.fn(),
      decodeToken: jest.fn()
    } as any

    // Mock AuthDomainService
    mockAuthDomainService = new AuthDomainService(
      mockTokenService
    ) as jest.Mocked<AuthDomainService>

    // Mock specific methods
    mockAuthDomainService.verifyToken = jest.fn()
    mockAuthDomainService.createAccessToken = jest.fn()
    mockAuthDomainService.createRefreshToken = jest.fn()
    mockAuthDomainService.shouldRefreshToken = jest.fn()

    // Mock repositories
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findByGoogleId: jest.fn(),
      findByRole: jest.fn(),
      findByStatus: jest.fn(),
      countByRole: jest.fn(),
      countByStatus: jest.fn(),
      existsByEmail: jest.fn()
    }

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

    useCase = new RefreshTokenUseCase(
      mockAuthDomainService,
      mockUserRepository,
      mockSessionRepository
    )
  })

  describe('토큰 갱신', () => {
    it('유효한 리프레시 토큰으로 새 액세스 토큰을 발급해야 한다', async () => {
      // Given
      const userId = 'user-123'
      const sessionId = 'session-123'
      const mockJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6MTcwMDAwMDAwMH0.mock-signature'
      
      const refreshToken = AuthToken.create(mockJWT, new Date(Date.now() + 7 * 24 * 3600000))
      const newAccessToken = AuthToken.create(mockJWT, new Date(Date.now() + 3600000))
      const newRefreshToken = AuthToken.create(mockJWT, new Date(Date.now() + 7 * 24 * 3600000))

      const tokenPayload = {
        sub: userId,
        email: 'user@example.com',
        role: 'user',
        sessionId: sessionId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor((Date.now() + 7 * 24 * 3600000) / 1000)
      }

      const mockSession = Session.createWithTokens(
        userId,
        AuthToken.create(mockJWT, new Date(Date.now() - 1000)), // 이전 액세스 토큰
        refreshToken,
        { id: sessionId, isActive: true }
      )

      const mockUser = User.create({
        id: userId,
        email: 'user@example.com',
        fullName: 'Test User'
      })

      mockAuthDomainService.verifyToken.mockResolvedValue(tokenPayload)
      mockSessionRepository.findById.mockResolvedValue(mockSession)
      mockUserRepository.findById.mockResolvedValue(mockUser)
      mockAuthDomainService.createAccessToken.mockResolvedValue(newAccessToken)
      mockAuthDomainService.shouldRefreshToken.mockReturnValue(true)
      mockAuthDomainService.createRefreshToken.mockResolvedValue(newRefreshToken)
      mockSessionRepository.update.mockResolvedValue(mockSession)

      const request: RefreshTokenRequestDto = {
        refreshToken: mockJWT
      }

      // When
      const result = await useCase.execute(request)

      // Then
      expect(result).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        tokenType: 'Bearer'
      })
      expect(mockAuthDomainService.verifyToken).toHaveBeenCalled()
      expect(mockSessionRepository.findById).toHaveBeenCalledWith(sessionId)
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId)
    })

    it('만료된 리프레시 토큰은 거부해야 한다', async () => {
      // Given
      const expiredJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6MTYwMDAwMDAwMH0.expired'
      const expiredToken = AuthToken.create(expiredJWT, new Date(Date.now() - 1000))

      mockAuthDomainService.verifyToken.mockRejectedValue(new Error('Token has expired'))

      const request: RefreshTokenRequestDto = {
        refreshToken: expiredJWT
      }

      // When & Then
      await expect(useCase.execute(request))
        .rejects.toThrow('토큰이 만료되었습니다')
    })

    it('비활성 세션은 토큰 갱신을 거부해야 한다', async () => {
      // Given
      const mockJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6MTcwMDAwMDAwMH0.mock-signature'
      
      const tokenPayload = {
        sub: 'user-123',
        email: 'user@example.com',
        role: 'user',
        sessionId: 'session-123',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor((Date.now() + 7 * 24 * 3600000) / 1000)
      }

      const inactiveSession = Session.create({
        id: 'session-123',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 3600000),
        isActive: false
      })

      mockAuthDomainService.verifyToken.mockResolvedValue(tokenPayload)
      mockSessionRepository.findById.mockResolvedValue(inactiveSession)

      const request: RefreshTokenRequestDto = {
        refreshToken: mockJWT
      }

      // When & Then
      await expect(useCase.execute(request))
        .rejects.toThrow('세션이 비활성화되었습니다')
    })

    it('정지된 사용자는 토큰 갱신을 할 수 없어야 한다', async () => {
      // Given
      const mockJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6MTcwMDAwMDAwMH0.mock-signature'
      
      const tokenPayload = {
        sub: 'user-123',
        email: 'user@example.com',
        role: 'user',
        sessionId: 'session-123',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor((Date.now() + 7 * 24 * 3600000) / 1000)
      }

      const activeSession = Session.createWithTokens(
        'user-123',
        AuthToken.create(mockJWT, new Date(Date.now() + 3600000)),
        AuthToken.create(mockJWT, new Date(Date.now() + 7 * 24 * 3600000)),
        { id: 'session-123', isActive: true }
      )

      const suspendedUser = User.create({
        id: 'user-123',
        email: 'user@example.com',
        fullName: 'Suspended User',
        status: 'suspended',
        suspendedUntil: new Date(Date.now() + 86400000)
      })

      mockAuthDomainService.verifyToken.mockResolvedValue(tokenPayload)
      mockSessionRepository.findById.mockResolvedValue(activeSession)
      mockUserRepository.findById.mockResolvedValue(suspendedUser)

      const request: RefreshTokenRequestDto = {
        refreshToken: mockJWT
      }

      // When & Then
      await expect(useCase.execute(request))
        .rejects.toThrow('계정이 정지되었습니다')
    })
  })
})