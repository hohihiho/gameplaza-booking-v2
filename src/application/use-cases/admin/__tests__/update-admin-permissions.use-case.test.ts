import { UpdateAdminPermissionsUseCase } from '../update-admin-permissions.use-case'
import { AdminRepository } from '@/src/domain/repositories/admin-repository.interface'
import { UserRepository } from '@/src/domain/repositories/user.repository.interface'
import { Admin } from '@/src/domain/entities/admin'
import { User } from '@/src/domain/entities/user'
import { UpdateAdminPermissionsRequestDto, SuperAdminCheckDto } from '@/src/application/dtos/admin.dto'

describe('UpdateAdminPermissionsUseCase', () => {
  let useCase: UpdateAdminPermissionsUseCase
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
    profileImageUrl: null,
    role: 'admin',
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

    useCase = new UpdateAdminPermissionsUseCase(adminRepository, userRepository)
  })

  describe('execute', () => {
    it('슈퍼관리자가 일반 관리자의 권한을 업데이트할 수 있다', async () => {
      // Given
      const request: UpdateAdminPermissionsRequestDto = {
        adminId: 'admin-regular-1',
        permissions: {
          reservations: true,
          users: true,
          devices: true,
          cms: true,
          settings: false
        }
      }

      adminRepository.findById
        .mockResolvedValueOnce(mockSuperAdmin) // 실행자 확인
        .mockResolvedValueOnce(mockRegularAdmin) // 대상 관리자 확인

      const updatedAdmin = mockRegularAdmin.updatePermissions(request.permissions)
      adminRepository.update.mockResolvedValue(updatedAdmin)
      userRepository.findById.mockResolvedValue(mockUser)

      // When
      const result = await useCase.execute(request, superAdminCheck)

      // Then
      expect(result).toMatchObject({
        id: 'admin-regular-1',
        userId: 'user-regular-1',
        permissions: request.permissions,
        isSuperAdmin: false
      })
      expect(adminRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'admin-regular-1',
          permissions: expect.objectContaining({
            _permissions: request.permissions
          })
        })
      )
    })

    it('슈퍼관리자의 권한은 변경할 수 없다', async () => {
      // Given
      const request: UpdateAdminPermissionsRequestDto = {
        adminId: 'admin-super-2',
        permissions: {
          reservations: false,
          users: false,
          devices: false,
          cms: false,
          settings: false
        }
      }

      const targetSuperAdmin = Admin.createSuperAdmin({
        id: 'admin-super-2',
        userId: 'user-super-2'
      })

      adminRepository.findById
        .mockResolvedValueOnce(mockSuperAdmin) // 실행자 확인
        .mockResolvedValueOnce(targetSuperAdmin) // 대상 관리자 확인

      // When & Then
      await expect(
        useCase.execute(request, superAdminCheck)
      ).rejects.toThrow('슈퍼관리자의 권한은 변경할 수 없습니다')
    })

    it('실행자가 슈퍼관리자가 아니면 에러가 발생한다', async () => {
      // Given
      adminRepository.findById.mockResolvedValue(mockRegularAdmin)

      // When & Then
      await expect(
        useCase.execute(
          { adminId: 'admin-regular-1', permissions: {} },
          { executorId: 'admin-regular-1', executorUserId: 'user-regular-1' }
        )
      ).rejects.toThrow('슈퍼관리자만 권한을 수정할 수 있습니다')
    })

    it('대상 관리자가 존재하지 않으면 에러가 발생한다', async () => {
      // Given
      adminRepository.findById
        .mockResolvedValueOnce(mockSuperAdmin) // 실행자 확인
        .mockResolvedValueOnce(null) // 대상 관리자 없음

      // When & Then
      await expect(
        useCase.execute(
          { adminId: 'admin-not-exist', permissions: {} },
          superAdminCheck
        )
      ).rejects.toThrow('관리자를 찾을 수 없습니다')
    })

    it('사용자 정보가 없으면 에러가 발생한다', async () => {
      // Given
      const request: UpdateAdminPermissionsRequestDto = {
        adminId: 'admin-regular-1',
        permissions: {
          reservations: true,
          users: true,
          devices: true,
          cms: true,
          settings: true
        }
      }

      adminRepository.findById
        .mockResolvedValueOnce(mockSuperAdmin)
        .mockResolvedValueOnce(mockRegularAdmin)

      const updatedAdmin = mockRegularAdmin.updatePermissions(request.permissions)
      adminRepository.update.mockResolvedValue(updatedAdmin)
      userRepository.findById.mockResolvedValue(null)

      // When & Then
      await expect(
        useCase.execute(request, superAdminCheck)
      ).rejects.toThrow('사용자 정보를 찾을 수 없습니다')
    })

    it('실행자가 존재하지 않으면 에러가 발생한다', async () => {
      // Given
      adminRepository.findById.mockResolvedValue(null)

      // When & Then
      await expect(
        useCase.execute(
          { adminId: 'admin-regular-1', permissions: {} },
          superAdminCheck
        )
      ).rejects.toThrow('권한이 없습니다')
    })
  })
})