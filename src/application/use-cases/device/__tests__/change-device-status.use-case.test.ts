import { ChangeDeviceStatusUseCase } from '../change-device-status.use-case'
import { IUserRepository } from '../../../../domain/repositories/user.repository.interface'
import { IDeviceRepository } from '../../../../domain/repositories/device.repository.interface'
import { User } from '../../../../domain/entities/user'
import { Device } from '../../../../domain/entities/device'
import { DeviceStatus } from '../../../../domain/value-objects/device-status'

describe('ChangeDeviceStatusUseCase', () => {
  let useCase: ChangeDeviceStatusUseCase
  let mockUserRepository: jest.Mocked<IUserRepository>
  let mockDeviceRepository: jest.Mocked<IDeviceRepository>

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn()
    } as any

    mockDeviceRepository = {
      findById: jest.fn(),
      update: jest.fn()
    } as any

    useCase = new ChangeDeviceStatusUseCase(
      mockUserRepository,
      mockDeviceRepository
    )
  })

  describe('execute', () => {
    it('관리자만 기기 상태를 변경할 수 있다', async () => {
      // Given
      const normalUser = User.create({
        id: 'user-123',
        email: 'user@example.com',
        name: 'Normal User',
        phone: '010-1234-5678',
        role: 'user'
      })
      mockUserRepository.findById.mockResolvedValue(normalUser)

      // When & Then
      await expect(useCase.execute({
        userId: 'user-123',
        deviceId: 'device-456',
        status: 'maintenance'
      })).rejects.toThrow('관리자만 기기 상태를 변경할 수 있습니다')
    })

    it('이미 동일한 상태인 경우 변경하지 않는다', async () => {
      // Given
      const admin = User.create({
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        phone: '010-1234-5678',
        role: 'admin'
      })
      mockUserRepository.findById.mockResolvedValue(admin)

      const device = Device.create({
        id: 'device-456',
        deviceTypeId: 'type-123',
        deviceNumber: 'PS5-001',
        status: DeviceStatus.available()
      })
      mockDeviceRepository.findById.mockResolvedValue(device)

      // When
      const result = await useCase.execute({
        userId: 'admin-123',
        deviceId: 'device-456',
        status: 'available'
      })

      // Then
      expect(result.message).toBe('기기가 이미 사용 가능 상태입니다')
      expect(mockDeviceRepository.update).not.toHaveBeenCalled()
    })

    it('점검 상태로 변경 시 사유가 필수이다', async () => {
      // Given
      const admin = User.create({
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        phone: '010-1234-5678',
        role: 'admin'
      })
      mockUserRepository.findById.mockResolvedValue(admin)

      const device = Device.create({
        id: 'device-456',
        deviceTypeId: 'type-123',
        deviceNumber: 'PS5-001',
        status: DeviceStatus.available()
      })
      mockDeviceRepository.findById.mockResolvedValue(device)

      // When & Then
      await expect(useCase.execute({
        userId: 'admin-123',
        deviceId: 'device-456',
        status: 'maintenance'
      })).rejects.toThrow('점검 사유를 입력해주세요')
    })

    it('고장 상태로 변경 시 사유가 필수이다', async () => {
      // Given
      const admin = User.create({
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        phone: '010-1234-5678',
        role: 'admin'
      })
      mockUserRepository.findById.mockResolvedValue(admin)

      const device = Device.create({
        id: 'device-456',
        deviceTypeId: 'type-123',
        deviceNumber: 'PS5-001',
        status: DeviceStatus.available()
      })
      mockDeviceRepository.findById.mockResolvedValue(device)

      // When & Then
      await expect(useCase.execute({
        userId: 'admin-123',
        deviceId: 'device-456',
        status: 'broken'
      })).rejects.toThrow('고장 사유를 입력해주세요')
    })

    it('사용 가능 상태에서 점검 중으로 변경한다', async () => {
      // Given
      const admin = User.create({
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        phone: '010-1234-5678',
        role: 'admin'
      })
      mockUserRepository.findById.mockResolvedValue(admin)

      const device = Device.create({
        id: 'device-456',
        deviceTypeId: 'type-123',
        deviceNumber: 'PS5-001',
        status: DeviceStatus.available()
      })
      mockDeviceRepository.findById.mockResolvedValue(device)
      mockDeviceRepository.update.mockImplementation(device => Promise.resolve(device))

      // When
      const result = await useCase.execute({
        userId: 'admin-123',
        deviceId: 'device-456',
        status: 'maintenance',
        notes: '정기 점검'
      })

      // Then
      expect(result.message).toBe('기기 상태가 점검 중(으)로 변경되었습니다')
      expect(mockDeviceRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'device-456',
          status: expect.objectContaining({ value: 'maintenance' })
        })
      )
    })

    it('점검 중에서 사용 가능으로 복구한다', async () => {
      // Given
      const admin = User.create({
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        phone: '010-1234-5678',
        role: 'admin'
      })
      mockUserRepository.findById.mockResolvedValue(admin)

      const device = Device.create({
        id: 'device-456',
        deviceTypeId: 'type-123',
        deviceNumber: 'PS5-001',
        status: DeviceStatus.maintenance(),
        notes: '정기 점검'
      })
      mockDeviceRepository.findById.mockResolvedValue(device)
      mockDeviceRepository.update.mockImplementation(device => Promise.resolve(device))

      // When
      const result = await useCase.execute({
        userId: 'admin-123',
        deviceId: 'device-456',
        status: 'available'
      })

      // Then
      expect(result.message).toBe('기기 상태가 사용 가능(으)로 변경되었습니다')
      expect(mockDeviceRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'device-456',
          status: expect.objectContaining({ value: 'available' }),
          notes: '점검 완료'
        })
      )
    })

    it('잘못된 상태 전환을 거부한다', async () => {
      // Given
      const admin = User.create({
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        phone: '010-1234-5678',
        role: 'admin'
      })
      mockUserRepository.findById.mockResolvedValue(admin)

      const device = Device.create({
        id: 'device-456',
        deviceTypeId: 'type-123',
        deviceNumber: 'PS5-001',
        status: DeviceStatus.broken(),
        notes: '화면 고장'
      })
      mockDeviceRepository.findById.mockResolvedValue(device)

      // When & Then - 고장에서 사용중으로 직접 전환 불가
      await expect(useCase.execute({
        userId: 'admin-123',
        deviceId: 'device-456',
        status: 'in_use'
      })).rejects.toThrow('기기 상태를 고장에서 사용 중(으)로 변경할 수 없습니다')
    })
  })
})