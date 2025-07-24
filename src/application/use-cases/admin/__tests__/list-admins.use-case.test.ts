import { ListAdminsUseCase } from '../list-admins.use-case'
import { AdminRepository } from '@/src/domain/repositories/admin-repository.interface'
import { UserRepository } from '@/src/domain/repositories/user.repository.interface'
import { Admin } from '@/src/domain/entities/admin'
import { User } from '@/src/domain/entities/user'
import { ListAdminsRequestDto, SuperAdminCheckDto } from '@/src/application/dtos/admin.dto'

describe('ListAdminsUseCase', () => {
  let useCase: ListAdminsUseCase
  let adminRepository: jest.Mocked<AdminRepository>
  let userRepository: jest.Mocked<UserRepository>

  const mockSuperAdmin = Admin.createSuperAdmin({
    id: 'admin-super-1',
    userId: 'user-super-1'
  })

  const mockRegularAdmin1 = Admin.createRegularAdmin({
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

  const mockRegularAdmin2 = Admin.createRegularAdmin({
    id: 'admin-regular-2',
    userId: 'user-regular-2',
    permissions: {
      reservations: false,
      users: true,
      devices: false,
      cms: true,
      settings: false
    }
  })

  const mockSuperAdmin2 = Admin.createSuperAdmin({
    id: 'admin-super-2',
    userId: 'user-super-2'
  })

  const mockUsers = [
    new User({
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
    }),
    new User({
      id: 'user-regular-1',
      email: 'admin1@example.com',
      fullName: '관리자1',
      phoneNumber: '010-2222-2222',
      profileImageUrl: null,
      role: 'admin',
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    new User({
      id: 'user-regular-2',
      email: 'admin2@example.com',
      fullName: '관리자2',
      phoneNumber: '010-3333-3333',
      profileImageUrl: null,
      role: 'admin',
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    new User({
      id: 'user-super-2',
      email: 'super2@example.com',
      fullName: '슈퍼관리자2',
      phoneNumber: '010-4444-4444',
      profileImageUrl: null,
      role: 'superadmin',
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  ]

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

    useCase = new ListAdminsUseCase(adminRepository, userRepository)
  })

  describe('execute', () => {
    it('모든 관리자 목록을 조회할 수 있다', async () => {
      // Given
      const request: ListAdminsRequestDto = {
        includeSuperAdmins: true,
        includeRegularAdmins: true,
        limit: 20,
        offset: 0
      }

      adminRepository.findById.mockResolvedValue(mockSuperAdmin)
      adminRepository.findAll.mockResolvedValue([
        mockSuperAdmin,
        mockRegularAdmin1,
        mockRegularAdmin2,
        mockSuperAdmin2
      ])

      userRepository.findById
        .mockResolvedValueOnce(mockUsers[0])
        .mockResolvedValueOnce(mockUsers[1])
        .mockResolvedValueOnce(mockUsers[2])
        .mockResolvedValueOnce(mockUsers[3])

      // When
      const result = await useCase.execute(request, superAdminCheck)

      // Then
      expect(result).toMatchObject({
        total: 4,
        limit: 20,
        offset: 0,
        admins: expect.arrayContaining([
          expect.objectContaining({
            id: 'admin-super-1',
            isSuperAdmin: true,
            user: expect.objectContaining({
              email: 'super1@example.com'
            })
          }),
          expect.objectContaining({
            id: 'admin-regular-1',
            isSuperAdmin: false,
            user: expect.objectContaining({
              email: 'admin1@example.com'
            })
          })
        ])
      })
      expect(result.admins).toHaveLength(4)
    })

    it('슈퍼관리자만 조회할 수 있다', async () => {
      // Given
      const request: ListAdminsRequestDto = {
        includeSuperAdmins: true,
        includeRegularAdmins: false
      }

      adminRepository.findById.mockResolvedValue(mockSuperAdmin)
      adminRepository.findSuperAdmins.mockResolvedValue([mockSuperAdmin, mockSuperAdmin2])

      userRepository.findById
        .mockResolvedValueOnce(mockUsers[0])
        .mockResolvedValueOnce(mockUsers[3])

      // When
      const result = await useCase.execute(request, superAdminCheck)

      // Then
      expect(result).toMatchObject({
        total: 2,
        admins: expect.arrayContaining([
          expect.objectContaining({
            isSuperAdmin: true
          })
        ])
      })
      expect(result.admins).toHaveLength(2)
      expect(adminRepository.findSuperAdmins).toHaveBeenCalled()
      expect(adminRepository.findAll).not.toHaveBeenCalled()
    })

    it('일반 관리자만 조회할 수 있다', async () => {
      // Given
      const request: ListAdminsRequestDto = {
        includeSuperAdmins: false,
        includeRegularAdmins: true
      }

      adminRepository.findById.mockResolvedValue(mockSuperAdmin)
      adminRepository.findRegularAdmins.mockResolvedValue([mockRegularAdmin1, mockRegularAdmin2])

      userRepository.findById
        .mockResolvedValueOnce(mockUsers[1])
        .mockResolvedValueOnce(mockUsers[2])

      // When
      const result = await useCase.execute(request, superAdminCheck)

      // Then
      expect(result).toMatchObject({
        total: 2,
        admins: expect.arrayContaining([
          expect.objectContaining({
            isSuperAdmin: false
          })
        ])
      })
      expect(result.admins).toHaveLength(2)
      expect(adminRepository.findRegularAdmins).toHaveBeenCalled()
      expect(adminRepository.findAll).not.toHaveBeenCalled()
    })

    it('페이지네이션이 올바르게 적용된다', async () => {
      // Given
      const request: ListAdminsRequestDto = {
        limit: 2,
        offset: 1
      }

      adminRepository.findById.mockResolvedValue(mockSuperAdmin)
      adminRepository.findAll.mockResolvedValue([
        mockSuperAdmin,
        mockRegularAdmin1,
        mockRegularAdmin2,
        mockSuperAdmin2
      ])

      userRepository.findById
        .mockResolvedValueOnce(mockUsers[1])
        .mockResolvedValueOnce(mockUsers[2])

      // When
      const result = await useCase.execute(request, superAdminCheck)

      // Then
      expect(result).toMatchObject({
        total: 4,
        limit: 2,
        offset: 1,
        admins: expect.arrayContaining([
          expect.objectContaining({
            id: 'admin-regular-1'
          }),
          expect.objectContaining({
            id: 'admin-regular-2'
          })
        ])
      })
      expect(result.admins).toHaveLength(2)
    })

    it('실행자가 슈퍼관리자가 아니면 에러가 발생한다', async () => {
      // Given
      adminRepository.findById.mockResolvedValue(mockRegularAdmin1)

      // When & Then
      await expect(
        useCase.execute(
          {},
          { executorId: 'admin-regular-1', executorUserId: 'user-regular-1' }
        )
      ).rejects.toThrow('슈퍼관리자만 관리자 목록을 조회할 수 있습니다')
    })

    it('사용자 정보가 없으면 에러가 발생한다', async () => {
      // Given
      adminRepository.findById.mockResolvedValue(mockSuperAdmin)
      adminRepository.findAll.mockResolvedValue([mockRegularAdmin1])
      userRepository.findById.mockResolvedValue(null)

      // When & Then
      await expect(
        useCase.execute({}, superAdminCheck)
      ).rejects.toThrow('사용자 정보를 찾을 수 없습니다: user-regular-1')
    })

    it('실행자가 존재하지 않으면 에러가 발생한다', async () => {
      // Given
      adminRepository.findById.mockResolvedValue(null)

      // When & Then
      await expect(
        useCase.execute({}, superAdminCheck)
      ).rejects.toThrow('권한이 없습니다')
    })

    it('필터 옵션이 모두 false면 빈 배열을 반환한다', async () => {
      // Given
      const request: ListAdminsRequestDto = {
        includeSuperAdmins: false,
        includeRegularAdmins: false
      }

      adminRepository.findById.mockResolvedValue(mockSuperAdmin)

      // When
      const result = await useCase.execute(request, superAdminCheck)

      // Then
      expect(result).toEqual({
        admins: [],
        total: 0,
        limit: 20,
        offset: 0
      })
    })
  })
})