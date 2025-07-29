import { GoogleAuthUseCase, IGoogleAuthService } from '../google-auth.use-case'
import { AuthDomainService, ITokenService } from '@/src/domain/services/auth-domain.service'
import { UserRepository } from '@/src/domain/repositories/user-repository.interface'
import { SessionRepository } from '@/src/domain/repositories/session-repository.interface'
import { User } from '@/src/domain/entities/user'
import { Session } from '@/src/domain/entities/session'
import { GoogleProfileDto, AuthRequestDto } from '../../../dtos/auth.dto'

// Mock implementations
class MockGoogleAuthService implements IGoogleAuthService {
  async verifyIdToken(idToken: string): Promise<GoogleProfileDto> {
    if (idToken === 'invalid-token') {
      throw new Error('Invalid token')
    }
    
    return {
      id: 'google-123',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/photo.jpg',
      email_verified: true
    }
  }
}

class MockTokenService implements ITokenService {
  async generateToken(_payload: any, _options?: any): Promise<string> {
    // JWT 형식의 mock 토큰 반환 (header.payload.signature)
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  }
  
  async verifyToken(_token: string): Promise<any> {
    return {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'user',
      sessionId: 'session-123',
      iat: Date.now() / 1000,
      exp: (Date.now() / 1000) + 3600
    }
  }
  
  decodeToken(token: string): any {
    return this.verifyToken(token)
  }
}

class MockUserRepository implements UserRepository {
  private users: Map<string, User> = new Map()

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null
  }

  async findByEmail(email: string): Promise<User | null> {
    return Array.from(this.users.values()).find(u => u.email === email) || null
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return Array.from(this.users.values()).find(u => u.googleId === googleId) || null
  }

  async findByRole(role: 'user' | 'admin'): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.role === role)
  }

  async save(user: User): Promise<User> {
    this.users.set(user.id, user)
    return user
  }

  async update(user: User): Promise<User> {
    this.users.set(user.id, user)
    return user
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id)
  }

  async findActiveUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.status === 'active')
  }

  async findSuspendedUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.status === 'suspended')
  }

  async findBannedUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.status === 'banned')
  }

  async countByStatus(status: 'active' | 'suspended' | 'banned'): Promise<number> {
    return Array.from(this.users.values()).filter(u => u.status === status).length
  }

  async existsByEmail(email: string): Promise<boolean> {
    return Array.from(this.users.values()).some(u => u.email === email)
  }
}

class MockSessionRepository implements SessionRepository {
  private sessions: Map<string, Session> = new Map()

  async findById(id: string): Promise<Session | null> {
    return this.sessions.get(id) || null
  }

  async findByUserId(userId: string): Promise<Session[]> {
    return Array.from(this.sessions.values()).filter(s => s.userId === userId)
  }

  async findActiveByUserId(userId: string): Promise<Session[]> {
    return Array.from(this.sessions.values()).filter(s => s.userId === userId && s.isActive)
  }

  async save(session: Session): Promise<Session> {
    this.sessions.set(session.id, session)
    return session
  }

  async update(session: Session): Promise<Session> {
    this.sessions.set(session.id, session)
    return session
  }

  async delete(id: string): Promise<void> {
    this.sessions.delete(id)
  }

  async deleteByUserId(userId: string): Promise<void> {
    const userSessions = await this.findByUserId(userId)
    userSessions.forEach(s => this.sessions.delete(s.id))
  }

  async findExpiredSessions(before?: Date): Promise<Session[]> {
    return Array.from(this.sessions.values()).filter(s => s.isExpired(before))
  }

  async findInactiveSessions(inactiveMinutes: number): Promise<Session[]> {
    return Array.from(this.sessions.values()).filter(s => 
      s.getInactiveSeconds() > inactiveMinutes * 60
    )
  }

  async deleteExpiredSessions(before?: Date): Promise<number> {
    const expired = await this.findExpiredSessions(before)
    expired.forEach(s => this.sessions.delete(s.id))
    return expired.length
  }

  async countActiveSessionsByUserId(userId: string): Promise<number> {
    return (await this.findActiveByUserId(userId)).length
  }

  async findByUserIdAndDevice(
    userId: string, 
    deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown'
  ): Promise<Session[]> {
    return Array.from(this.sessions.values()).filter(s => 
      s.userId === userId && s.deviceInfo?.type === deviceType
    )
  }
}

describe('GoogleAuthUseCase', () => {
  let useCase: GoogleAuthUseCase
  let googleAuthService: IGoogleAuthService
  let tokenService: ITokenService
  let authDomainService: AuthDomainService
  let userRepository: UserRepository
  let sessionRepository: SessionRepository

  beforeEach(() => {
    googleAuthService = new MockGoogleAuthService()
    tokenService = new MockTokenService()
    authDomainService = new AuthDomainService(tokenService)
    userRepository = new MockUserRepository()
    sessionRepository = new MockSessionRepository()

    useCase = new GoogleAuthUseCase(
      googleAuthService,
      authDomainService,
      userRepository,
      sessionRepository
    )
  })

  describe('execute', () => {
    const validRequest: AuthRequestDto = {
      googleIdToken: 'valid-google-token',
      deviceInfo: {
        type: 'mobile',
        os: 'iOS',
        browser: 'Safari'
      },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (iPhone)'
    }

    it('새로운 사용자로 회원가입해야 한다', async () => {
      const result = await useCase.execute(validRequest)

      expect(result.user.email).toBe('test@example.com')
      expect(result.user.fullName).toBe('Test User')
      expect(result.user.isNewUser).toBe(true)
      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
      expect(result.session.id).toBeDefined()
      expect(result.tokenType).toBe('Bearer')
    })

    it('기존 사용자로 로그인해야 한다', async () => {
      // 기존 사용자 생성
      const existingUser = User.create({
        id: 'existing-user-123',
        email: 'test@example.com',
        fullName: 'Existing User',
        googleId: 'google-123'
      })
      await userRepository.save(existingUser)

      const result = await useCase.execute(validRequest)

      expect(result.user.id).toBe('existing-user-123')
      expect(result.user.isNewUser).toBe(false)
      expect(result.accessToken).toBeDefined()
    })

    it('Google 계정이 연동되지 않은 기존 사용자에게 연동해야 한다', async () => {
      // Google 계정 연동 안 된 기존 사용자
      const existingUser = User.create({
        id: 'existing-user-456',
        email: 'test@example.com',
        fullName: 'Existing User Without Google'
      })
      await userRepository.save(existingUser)

      const result = await useCase.execute(validRequest)

      expect(result.user.id).toBe('existing-user-456')
      expect(result.user.isNewUser).toBe(false)
      
      // Google ID가 연동되었는지 확인
      const updatedUser = await userRepository.findById('existing-user-456')
      expect(updatedUser?.googleId).toBe('google-123')
    })

    it('이메일 인증이 안 된 경우 에러가 발생해야 한다', async () => {
      jest.spyOn(googleAuthService, 'verifyIdToken').mockResolvedValue({
        id: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        email_verified: false
      })

      await expect(useCase.execute(validRequest)).rejects.toThrow('이메일 인증이 필요합니다')
    })

    it('잘못된 Google 토큰인 경우 에러가 발생해야 한다', async () => {
      const invalidRequest = {
        ...validRequest,
        googleIdToken: 'invalid-token'
      }

      await expect(useCase.execute(invalidRequest)).rejects.toThrow('Google 인증 실패')
    })

    it('정지된 사용자는 로그인할 수 없어야 한다', async () => {
      // 정지된 사용자 생성
      const suspendedUser = User.create({
        id: 'suspended-user',
        email: 'test@example.com',
        fullName: 'Suspended User',
        googleId: 'google-123',
        status: 'suspended',
        suspendedUntil: new Date(Date.now() + 60 * 60 * 1000) // 1시간 후까지 정지
      })
      await userRepository.save(suspendedUser)

      await expect(useCase.execute(validRequest)).rejects.toThrow('User cannot login')
    })

    it('디바이스 정보가 세션에 저장되어야 한다', async () => {
      const result = await useCase.execute(validRequest)

      const savedSession = await sessionRepository.findById(result.session.id)
      expect(savedSession?.deviceInfo).toEqual({
        type: 'mobile',
        os: 'iOS',
        browser: 'Safari'
      })
      expect(savedSession?.ipAddress).toBe('192.168.1.1')
      expect(savedSession?.userAgent).toBe('Mozilla/5.0 (iPhone)')
    })
  })
})