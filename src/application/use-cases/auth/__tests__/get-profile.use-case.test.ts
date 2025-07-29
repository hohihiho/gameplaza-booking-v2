import { GetProfileUseCase } from '../get-profile.use-case'
import { UserRepository } from '@/src/domain/repositories/user-repository.interface'
import { User } from '@/src/domain/entities/user'

describe('GetProfileUseCase - Unit Tests', () => {
  let useCase: GetProfileUseCase
  let mockUserRepository: jest.Mocked<UserRepository>

  beforeEach(() => {
    // Mock UserRepository
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

    useCase = new GetProfileUseCase(mockUserRepository)
  })

  describe('프로필 조회', () => {
    it('존재하는 사용자의 프로필을 반환해야 한다', async () => {
      // Given
      const userId = 'user-123'
      const mockUser = User.create({
        id: userId,
        email: 'user@example.com',
        fullName: 'Test User',
        phone: '010-1234-5678',
        profileImageUrl: 'https://example.com/profile.jpg',
        marketingAgreed: true,
        termsAgreedAt: new Date('2024-01-01'),
        privacyAgreedAt: new Date('2024-01-01'),
        marketingAgreedAt: new Date('2024-01-01')
      })

      mockUserRepository.findById.mockResolvedValue(mockUser)

      // When
      const result = await useCase.execute(userId)

      // Then
      expect(result).toMatchObject({
        id: userId,
        email: 'user@example.com',
        fullName: 'Test User',
        phone: '010-1234-5678',
        role: 'user',
        status: 'active',
        profileImageUrl: 'https://example.com/profile.jpg',
        marketingAgreed: true,
        termsAgreedAt: expect.any(String),
        privacyAgreedAt: expect.any(String),
        marketingAgreedAt: expect.any(String),
        createdAt: expect.any(String),
        lastLoginAt: null
      })
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId)
    })

    it('Google 계정 정보가 있는 프로필을 반환해야 한다', async () => {
      // Given
      const userId = 'user-123'
      const mockUser = User.create({
        id: userId,
        email: 'user@gmail.com',
        fullName: 'Google User',
        googleId: 'google-123',
        profileImageUrl: 'https://lh3.googleusercontent.com/a/photo.jpg'
      })

      mockUserRepository.findById.mockResolvedValue(mockUser)

      // When
      const result = await useCase.execute(userId)

      // Then
      expect(result).toMatchObject({
        id: userId,
        email: 'user@gmail.com',
        fullName: 'Google User',
        googleId: 'google-123',
        profileImageUrl: 'https://lh3.googleusercontent.com/a/photo.jpg'
      })
    })

    it('존재하지 않는 사용자는 오류를 던져야 한다', async () => {
      // Given
      const userId = 'non-existent-user'
      mockUserRepository.findById.mockResolvedValue(null)

      // When & Then
      await expect(useCase.execute(userId))
        .rejects.toThrow('사용자를 찾을 수 없습니다')
    })

    it('정지된 사용자도 프로필을 조회할 수 있어야 한다', async () => {
      // Given
      const userId = 'user-123'
      const suspendedUser = User.create({
        id: userId,
        email: 'suspended@example.com',
        fullName: 'Suspended User',
        status: 'suspended',
        suspendedUntil: new Date(Date.now() + 86400000),
        suspendedReason: '규칙 위반'
      })

      mockUserRepository.findById.mockResolvedValue(suspendedUser)

      // When
      const result = await useCase.execute(userId)

      // Then
      expect(result).toMatchObject({
        id: userId,
        email: 'suspended@example.com',
        fullName: 'Suspended User',
        status: 'suspended',
        suspendedUntil: expect.any(String),
        suspendedReason: '규칙 위반'
      })
    })
  })
})