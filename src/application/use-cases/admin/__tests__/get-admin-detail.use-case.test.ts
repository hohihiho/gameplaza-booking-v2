import { GetAdminDetailUseCase } from '../get-admin-detail.use-case'
import { AdminRepository } from '@/src/domain/repositories/admin-repository.interface'
import { UserRepository } from '@/src/domain/repositories/user.repository.interface'
import { Admin } from '@/src/domain/entities/admin'
import { User } from '@/src/domain/entities/user'
import { GetAdminDetailRequestDto, SuperAdminCheckDto } from '@/src/application/dtos/admin.dto'

describe('GetAdminDetailUseCase', () => {
  let useCase: GetAdminDetailUseCase
  let adminRepository: jest.Mocked<AdminRepository>
  let userRepository: jest.Mocked<UserRepository>

  const mockSuperAdmin = Admin.createSuperAdmin({
    id: 'admin-super-1',
    userId: 'user-super-1'
  })

  const mockRegularAdmin = Admin.createRegularAdmin({
    id: 'admin-regular-1',
    userId: 'user-regular-1',
    permissions: {
      reservations: true,
      users: false,
      devices: true,
      cms: false,
      settings: false
    }
  })

  const mockUser = new User({
    id: 'user-regular-1',
    email: 'admin@example.com',
    fullName: '관리자',
    phoneNumber: '010-1234-5678',
    profileImageUrl: 'https://example.com/profile.jpg',
    role: 'admin',
    isActive: true,
    lastLoginAt: new Date('2025-01-01T09:00:00'),
    createdAt: new Date('2024-12-01T09:00:00'),
    updatedAt: new Date('2025-01-01T10:00:00')
  })

  const superAdminCheck: SuperAdminCheckDto = {
    executorId: 'admin-super-1',
    executorUserId: 'user-super-1'
  }

  beforeEach(() => {
    adminRepository = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findAll: jest.fn(),
      findSuperAdmins: jest.fn(),
      findRegularAdmins: jest.fn(),
      countSuperAdmins: jest.fn(),
      exists: jest.fn()
    }

    userRepository = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      findAll: jest.fn(),
      exists: jest.fn()
    }

    useCase = new GetAdminDetailUseCase(adminRepository, userRepository)
  })

  describe('execute', () => {
    it('슈퍼관리자가 일반 관리자의 상세 정보를 조회할 수 있다', async () => {
      // Given
      const request: GetAdminDetailRequestDto = {
        adminId: 'admin-regular-1'
      }

      adminRepository.findById
        .mockResolvedValueOnce(mockSuperAdmin) // 실행자 확인
        .mockResolvedValueOnce(mockRegularAdmin) // 대상 관리자 확인

      userRepository.findById.mockResolvedValue(mockUser)

      // When
      const result = await useCase.execute(request, superAdminCheck)

      // Then
      expect(result).toEqual({
        id: 'admin-regular-1',
        userId: 'user-regular-1',
        user: {
          id: 'user-regular-1',
          email: 'admin@example.com',
          fullName: '관리자',
          profileImageUrl: 'https://example.com/profile.jpg'
        },
        permissions: {
          reservations: true,
          users: false,
          devices: true,
          cms: false,
          settings: false
        },
        isSuperAdmin: false,
        createdAt: mockRegularAdmin.createdAt,
        updatedAt: mockRegularAdmin.updatedAt
      })
    })

    it('슈퍼관리자가 다른 슈퍼관리자의 상세 정보를 조회할 수 있다', async () => {
      // Given
      const request: GetAdminDetailRequestDto = {
        adminId: 'admin-super-2'
      }

      const targetSuperAdmin = Admin.createSuperAdmin({
        id: 'admin-super-2',
        userId: 'user-super-2'
      })

      const targetUser = new User({
        id: 'user-super-2',
        email: 'super2@example.com',
        fullName: '슈퍼관리자2',
        phoneNumber: '010-9999-9999',
        profileImageUrl: null,
        role: 'superadmin',
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      adminRepository.findById
        .mockResolvedValueOnce(mockSuperAdmin) // 실행자 확인
        .mockResolvedValueOnce(targetSuperAdmin) // 대상 관리자 확인

      userRepository.findById.mockResolvedValue(targetUser)

      // When
      const result = await useCase.execute(request, superAdminCheck)

      // Then
      expect(result).toMatchObject({
        id: 'admin-super-2',
        userId: 'user-super-2',
        user: {
          id: 'user-super-2',
          email: 'super2@example.com',
          fullName: '슈퍼관리자2'
        },
        permissions: {
          reservations: true,
          users: true,
          devices: true,
          cms: true,
          settings: true
        },
        isSuperAdmin: true
      })
    })

    it('실행자가 슈퍼관리자가 아니면 에러가 발생한다', async () => {
      // Given
      adminRepository.findById.mockResolvedValue(mockRegularAdmin)

      // When & Then
      await expect(
        useCase.execute(
          { adminId: 'admin-regular-1' },
          { executorId: 'admin-regular-1', executorUserId: 'user-regular-1' }
        )
      ).rejects.toThrow('슈퍼관리자만 관리자 정보를 조회할 수 있습니다')
    })

    it('대상 관리자가 존재하지 않으면 에러가 발생한다', async () => {
      // Given
      adminRepository.findById
        .mockResolvedValueOnce(mockSuperAdmin) // 실행자 확인
        .mockResolvedValueOnce(null) // 대상 관리자 없음

      // When & Then
      await expect(
        useCase.execute(
          { adminId: 'admin-not-exist' },
          superAdminCheck
        )
      ).rejects.toThrow('관리자를 찾을 수 없습니다')
    })

    it('사용자 정보가 없으면 에러가 발생한다', async () => {
      // Given
      adminRepository.findById
        .mockResolvedValueOnce(mockSuperAdmin) // 실행자 확인
        .mockResolvedValueOnce(mockRegularAdmin) // 대상 관리자 확인

      userRepository.findById.mockResolvedValue(null)

      // When & Then
      await expect(
        useCase.execute(
          { adminId: 'admin-regular-1' },
          superAdminCheck
        )
      ).rejects.toThrow('사용자 정보를 찾을 수 없습니다')
    })

    it('실행자가 존재하지 않으면 에러가 발생한다', async () => {
      // Given
      adminRepository.findById.mockResolvedValue(null)

      // When & Then
      await expect(
        useCase.execute(
          { adminId: 'admin-regular-1' },
          superAdminCheck
        )
      ).rejects.toThrow('권한이 없습니다')
    })

    it('자기 자신의 정보도 조회할 수 있다', async () => {
      // Given
      const request: GetAdminDetailRequestDto = {
        adminId: 'admin-super-1'
      }

      const executorUser = new User({
        id: 'user-super-1',
        email: 'super1@example.com',
        fullName: '슈퍼관리자1',
        phoneNumber: '010-1111-1111',
        profileImageUrl: null,
        role: 'superadmin',
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      adminRepository.findById
        .mockResolvedValueOnce(mockSuperAdmin) // 실행자 확인
        .mockResolvedValueOnce(mockSuperAdmin) // 대상 관리자 확인 (자기 자신)

      userRepository.findById.mockResolvedValue(executorUser)

      // When
      const result = await useCase.execute(request, superAdminCheck)

      // Then
      expect(result).toMatchObject({
        id: 'admin-super-1',
        userId: 'user-super-1',
        user: {
          email: 'super1@example.com'
        },
        isSuperAdmin: true
      })
    })
  })
})