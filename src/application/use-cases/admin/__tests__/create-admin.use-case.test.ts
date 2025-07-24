import { CreateAdminUseCase } from '../create-admin.use-case'
import { AdminRepository } from '@/src/domain/repositories/admin-repository.interface'
import { UserRepository } from '@/src/domain/repositories/user.repository.interface'
import { Admin } from '@/src/domain/entities/admin'
import { User } from '@/src/domain/entities/user'
import { CreateAdminRequestDto, SuperAdminCheckDto } from '@/src/application/dtos/admin.dto'

describe('CreateAdminUseCase', () => {
  let useCase: CreateAdminUseCase
  let adminRepository: jest.Mocked<AdminRepository>
  let userRepository: jest.Mocked<UserRepository>

  const mockSuperAdmin = Admin.createSuperAdmin({
    id: 'admin-super-1',
    userId: 'user-super-1'
  })

  const mockUser = new User({
    id: 'user-1',
    email: 'test@example.com',
    fullName: '테스트 사용자',
    phoneNumber: '010-1234-5678',
    profileImageUrl: null,
    role: 'user',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
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

    useCase = new CreateAdminUseCase(adminRepository, userRepository)
  })

  describe('execute', () => {
    it('슈퍼관리자가 일반 관리자를 생성할 수 있다', async () => {
      // Given
      const request: CreateAdminRequestDto = {
        userId: 'user-1',
        permissions: {
          reservations: true,
          users: false,
          devices: true,
          cms: false,
          settings: false
        },
        isSuperAdmin: false
      }

      adminRepository.findById.mockResolvedValue(mockSuperAdmin)
      userRepository.findById.mockResolvedValue(mockUser)
      adminRepository.findByUserId.mockResolvedValue(null)
      adminRepository.create.mockImplementation(async (admin) => admin)

      // When
      const result = await useCase.execute(request, superAdminCheck)

      // Then
      expect(result).toMatchObject({
        userId: 'user-1',
        permissions: request.permissions,
        isSuperAdmin: false,
        user: {
          id: 'user-1',
          email: 'test@example.com',
          fullName: '테스트 사용자'
        }
      })
      expect(adminRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          isSuperAdmin: false
        })
      )
    })

    it('슈퍼관리자가 다른 슈퍼관리자를 생성할 수 있다', async () => {
      // Given
      const request: CreateAdminRequestDto = {
        userId: 'user-1',
        permissions: {},
        isSuperAdmin: true
      }

      adminRepository.findById.mockResolvedValue(mockSuperAdmin)
      userRepository.findById.mockResolvedValue(mockUser)
      adminRepository.findByUserId.mockResolvedValue(null)
      adminRepository.create.mockImplementation(async (admin) => admin)

      // When
      const result = await useCase.execute(request, superAdminCheck)

      // Then
      expect(result).toMatchObject({
        userId: 'user-1',
        isSuperAdmin: true,
        permissions: {
          reservations: true,
          users: true,
          devices: true,
          cms: true,
          settings: true
        }
      })
    })

    it('실행자가 슈퍼관리자가 아니면 에러가 발생한다', async () => {
      // Given
      const regularAdmin = Admin.createRegularAdmin({
        id: 'admin-regular-1',
        userId: 'user-regular-1',
        permissions: {}
      })

      adminRepository.findById.mockResolvedValue(regularAdmin)

      // When & Then
      await expect(
        useCase.execute(
          { userId: 'user-1', permissions: {}, isSuperAdmin: false },
          { executorId: 'admin-regular-1', executorUserId: 'user-regular-1' }
        )
      ).rejects.toThrow('슈퍼관리자만 관리자를 생성할 수 있습니다')
    })

    it('대상 사용자가 존재하지 않으면 에러가 발생한다', async () => {
      // Given
      adminRepository.findById.mockResolvedValue(mockSuperAdmin)
      userRepository.findById.mockResolvedValue(null)

      // When & Then
      await expect(
        useCase.execute(
          { userId: 'user-not-exist', permissions: {}, isSuperAdmin: false },
          superAdminCheck
        )
      ).rejects.toThrow('사용자를 찾을 수 없습니다')
    })

    it('이미 관리자로 등록된 사용자는 에러가 발생한다', async () => {
      // Given
      adminRepository.findById.mockResolvedValue(mockSuperAdmin)
      userRepository.findById.mockResolvedValue(mockUser)
      adminRepository.findByUserId.mockResolvedValue(
        Admin.createRegularAdmin({
          id: 'admin-existing',
          userId: 'user-1',
          permissions: {}
        })
      )

      // When & Then
      await expect(
        useCase.execute(
          { userId: 'user-1', permissions: {}, isSuperAdmin: false },
          superAdminCheck
        )
      ).rejects.toThrow('이미 관리자로 등록된 사용자입니다')
    })

    it('실행자가 존재하지 않으면 에러가 발생한다', async () => {
      // Given
      adminRepository.findById.mockResolvedValue(null)

      // When & Then
      await expect(
        useCase.execute(
          { userId: 'user-1', permissions: {}, isSuperAdmin: false },
          superAdminCheck
        )
      ).rejects.toThrow('권한이 없습니다')
    })
  })
})