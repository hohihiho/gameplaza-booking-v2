import { DeleteAdminUseCase } from '../delete-admin.use-case'
import { AdminRepository } from '@/src/domain/repositories/admin-repository.interface'
import { Admin } from '@/src/domain/entities/admin'
import { DeleteAdminRequestDto, SuperAdminCheckDto } from '@/src/application/dtos/admin.dto'

describe('DeleteAdminUseCase', () => {
  let useCase: DeleteAdminUseCase
  let adminRepository: jest.Mocked<AdminRepository>

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

    useCase = new DeleteAdminUseCase(adminRepository)
  })

  describe('execute', () => {
    it('슈퍼관리자가 일반 관리자를 삭제할 수 있다', async () => {
      // Given
      const request: DeleteAdminRequestDto = {
        adminId: 'admin-regular-1'
      }

      adminRepository.findById
        .mockResolvedValueOnce(mockSuperAdmin) // 실행자 확인
        .mockResolvedValueOnce(mockRegularAdmin) // 대상 관리자 확인

      adminRepository.delete.mockResolvedValue(undefined)

      // When
      const result = await useCase.execute(request, superAdminCheck)

      // Then
      expect(result).toEqual({
        success: true,
        adminId: 'admin-regular-1',
        message: '관리자가 성공적으로 삭제되었습니다'
      })
      expect(adminRepository.delete).toHaveBeenCalledWith('admin-regular-1')
    })

    it('슈퍼관리자는 삭제할 수 없다', async () => {
      // Given
      const request: DeleteAdminRequestDto = {
        adminId: 'admin-super-2'
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
      ).rejects.toThrow('슈퍼관리자는 삭제할 수 없습니다')
    })

    it('자기 자신은 삭제할 수 없다', async () => {
      // Given
      const request: DeleteAdminRequestDto = {
        adminId: 'admin-super-1'
      }

      adminRepository.findById
        .mockResolvedValueOnce(mockSuperAdmin) // 실행자 확인
        .mockResolvedValueOnce(mockSuperAdmin) // 대상 관리자 확인 (동일인)

      // When & Then
      await expect(
        useCase.execute(request, superAdminCheck)
      ).rejects.toThrow('자기 자신은 삭제할 수 없습니다')
    })

    it('실행자가 슈퍼관리자가 아니면 에러가 발생한다', async () => {
      // Given
      adminRepository.findById.mockResolvedValue(mockRegularAdmin)

      // When & Then
      await expect(
        useCase.execute(
          { adminId: 'admin-regular-2' },
          { executorId: 'admin-regular-1', executorUserId: 'user-regular-1' }
        )
      ).rejects.toThrow('슈퍼관리자만 관리자를 삭제할 수 있습니다')
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

    it('일반 관리자가 다른 일반 관리자를 삭제하려고 하면 에러가 발생한다', async () => {
      // Given
      const anotherRegularAdmin = Admin.createRegularAdmin({
        id: 'admin-regular-2',
        userId: 'user-regular-2',
        permissions: {}
      })

      adminRepository.findById
        .mockResolvedValueOnce(mockRegularAdmin) // 실행자 확인 (일반 관리자)
        .mockResolvedValueOnce(anotherRegularAdmin) // 대상 관리자 확인

      // When & Then
      await expect(
        useCase.execute(
          { adminId: 'admin-regular-2' },
          { executorId: 'admin-regular-1', executorUserId: 'user-regular-1' }
        )
      ).rejects.toThrow('슈퍼관리자만 관리자를 삭제할 수 있습니다')
    })
  })
})