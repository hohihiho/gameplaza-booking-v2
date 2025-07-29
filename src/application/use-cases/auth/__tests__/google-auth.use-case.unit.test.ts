import { GoogleAuthUseCase } from '../google-auth.use-case'
import { GoogleAuthService } from '@/src/infrastructure/services/google-auth.service'
import { AuthDomainService } from '@/src/domain/services/auth-domain.service'
import { UserRepository } from '@/src/domain/repositories/user-repository.interface'
import { SessionRepository } from '@/src/domain/repositories/session-repository.interface'
import { User } from '@/src/domain/entities/user'
import { Session } from '@/src/domain/entities/session'
import { AuthToken } from '@/src/domain/value-objects/auth-token'
import { AuthRequestDto } from '@/src/application/dtos/auth.dto'

describe('GoogleAuthUseCase - Unit Tests', () => {
  let useCase: GoogleAuthUseCase
  let mockGoogleAuthService: jest.Mocked<GoogleAuthService>
  let mockAuthDomainService: jest.Mocked<AuthDomainService>
  let mockUserRepository: jest.Mocked<UserRepository>
  let mockSessionRepository: jest.Mocked<SessionRepository>

  beforeEach(() => {
    // Mock dependencies
    mockGoogleAuthService = {
      verifyIdToken: jest.fn()
    } as any

    mockAuthDomainService = {
      generateTokenPair: jest.fn(),
      generateSessionId: jest.fn(),
      parseDeviceInfo: jest.fn(),
      handleGoogleAuth: jest.fn(),
      createAccessToken: jest.fn(),
      createRefreshToken: jest.fn(),
      createSession: jest.fn()
    } as any

    mockUserRepository = {
      findByEmail: jest.fn(),
      findByGoogleId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
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

    useCase = new GoogleAuthUseCase(
      mockGoogleAuthService,
      mockAuthDomainService,
      mockUserRepository,
      mockSessionRepository
    )
  })

  describe('신규 사용자 로그인', () => {
    it('Google 계정으로 새 사용자를 생성하고 로그인해야 한다', async () => {
      // Given
      const googleProfile = {
        id: 'google-123',
        email: 'newuser@example.com',
        name: 'New User',
        picture: 'https://example.com/photo.jpg',
        email_verified: true
      }

      const mockJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6MTcwMDAwMDAwMH0.mock-signature'
      const mockTokens = {
        accessToken: AuthToken.create(mockJWT, new Date(Date.now() + 3600000)),
        refreshToken: AuthToken.create(mockJWT, new Date(Date.now() + 7 * 24 * 3600000))
      }

      const newUser = User.createFromGoogle(googleProfile)
      const mockSession = Session.createWithTokens(
        newUser.id,
        mockTokens.accessToken,
        mockTokens.refreshToken,
        {
          id: 'session-123',
          deviceInfo: { type: 'desktop', os: 'Windows', browser: 'Chrome' },
          ipAddress: '127.0.0.1',
          userAgent: 'Test Browser'
        }
      )

      mockGoogleAuthService.verifyIdToken.mockResolvedValue(googleProfile)
      mockUserRepository.findByEmail.mockResolvedValue(null)
      mockUserRepository.save.mockResolvedValue(newUser)
      mockAuthDomainService.handleGoogleAuth.mockResolvedValue({
        user: newUser,
        token: mockTokens.accessToken,
        session: mockSession
      })
      mockAuthDomainService.createRefreshToken.mockResolvedValue(mockTokens.refreshToken)
      mockSessionRepository.save.mockResolvedValue(mockSession)

      const request: AuthRequestDto = {
        googleIdToken: 'valid-google-token',
        deviceInfo: { type: 'desktop', os: 'Windows', browser: 'Chrome' },
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser'
      }

      // When
      const result = await useCase.execute(request)

      // Then
      expect(result).toMatchObject({
        user: expect.objectContaining({
          email: 'newuser@example.com',
          fullName: 'New User'
        }),
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        tokenType: 'Bearer'
      })
      expect(mockUserRepository.save).toHaveBeenCalled()
      expect(mockSessionRepository.save).toHaveBeenCalled()
    })
  })

  describe('기존 사용자 로그인', () => {
    it('기존 Google 사용자로 로그인해야 한다', async () => {
      // Given
      const googleProfile = {
        id: 'google-123',
        email: 'existing@example.com',
        name: 'Existing User',
        picture: 'https://example.com/photo.jpg',
        email_verified: true
      }

      const existingUser = User.create({
        id: 'user-123',
        email: 'existing@example.com',
        fullName: 'Existing User',
        googleId: 'google-123',
        profileImageUrl: 'https://example.com/photo.jpg'
      })

      const mockJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6MTcwMDAwMDAwMH0.mock-signature'
      const mockTokens = {
        accessToken: AuthToken.create(mockJWT, new Date(Date.now() + 3600000)),
        refreshToken: AuthToken.create(mockJWT, new Date(Date.now() + 7 * 24 * 3600000))
      }

      mockGoogleAuthService.verifyIdToken.mockResolvedValue(googleProfile)
      mockUserRepository.findByEmail.mockResolvedValue(existingUser)
      mockAuthDomainService.handleGoogleAuth.mockResolvedValue({
        user: existingUser.recordSuccessfulLogin(),
        token: mockTokens.accessToken,
        session: Session.createWithTokens(
          existingUser.id,
          mockTokens.accessToken,
          mockTokens.refreshToken,
          { id: 'session-123' }
        )
      })
      const savedSession = Session.createWithTokens(
        existingUser.id,
        mockTokens.accessToken,
        mockTokens.refreshToken,
        { 
          id: 'session-123',
          deviceInfo: { type: 'mobile', os: 'iOS', browser: 'Safari' }
        }
      )
      
      mockAuthDomainService.createRefreshToken.mockResolvedValue(mockTokens.refreshToken)
      mockUserRepository.update.mockResolvedValue(existingUser.recordSuccessfulLogin())
      mockSessionRepository.save.mockResolvedValue(savedSession)

      const request: AuthRequestDto = {
        googleIdToken: 'valid-google-token',
        deviceInfo: { type: 'mobile', os: 'iOS', browser: 'Safari' }
      }

      // When
      const result = await useCase.execute(request)

      // Then
      expect(result.user.id).toBe('user-123')
      expect(mockUserRepository.save).not.toHaveBeenCalled()
      expect(mockUserRepository.update).toHaveBeenCalled()
    })
  })

  describe('오류 처리', () => {
    it('이메일이 인증되지 않은 경우 오류를 던져야 한다', async () => {
      // Given
      const googleProfile = {
        id: 'google-123',
        email: 'unverified@example.com',
        name: 'Unverified User',
        email_verified: false
      }

      mockGoogleAuthService.verifyIdToken.mockResolvedValue(googleProfile)

      const request: AuthRequestDto = {
        googleIdToken: 'valid-google-token'
      }

      // When & Then
      await expect(useCase.execute(request))
        .rejects.toThrow('이메일 인증이 필요합니다')
    })

    it('정지된 사용자는 로그인할 수 없어야 한다', async () => {
      // Given
      const googleProfile = {
        id: 'google-123',
        email: 'suspended@example.com',
        name: 'Suspended User',
        email_verified: true
      }

      const suspendedUser = User.create({
        id: 'user-123',
        email: 'suspended@example.com',
        fullName: 'Suspended User',
        status: 'suspended',
        suspendedUntil: new Date(Date.now() + 86400000) // 24시간 후
      })

      mockGoogleAuthService.verifyIdToken.mockResolvedValue(googleProfile)
      mockUserRepository.findByEmail.mockResolvedValue(suspendedUser)
      mockAuthDomainService.parseDeviceInfo.mockReturnValue({ type: 'desktop' })
      // handleGoogleAuth는 정지된 사용자를 체크하여 오류를 던질 것임
      mockAuthDomainService.handleGoogleAuth.mockRejectedValue(
        new Error('로그인할 수 없는 계정 상태입니다')
      )

      const request: AuthRequestDto = {
        googleIdToken: 'valid-google-token'
      }

      // When & Then
      await expect(useCase.execute(request))
        .rejects.toThrow('로그인할 수 없는 계정 상태입니다')
    })
  })
})