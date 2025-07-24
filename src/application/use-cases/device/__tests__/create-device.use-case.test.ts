import { CreateDeviceUseCase } from '../create-device.use-case'
import { IUserRepository } from '../../../../domain/repositories/user.repository.interface'
import { IDeviceRepository, IDeviceTypeRepository } from '../../../../domain/repositories/device.repository.interface'
import { User } from '../../../../domain/entities/user'
import { DeviceType } from '../../../../domain/entities/device'

describe('CreateDeviceUseCase', () => {
  let useCase: CreateDeviceUseCase
  let mockUserRepository: jest.Mocked<IUserRepository>
  let mockDeviceRepository: jest.Mocked<IDeviceRepository>
  let mockDeviceTypeRepository: jest.Mocked<IDeviceTypeRepository>

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn()
    } as any

    mockDeviceRepository = {
      existsByDeviceNumber: jest.fn(),
      save: jest.fn()
    } as any

    mockDeviceTypeRepository = {
      findById: jest.fn()
    } as any

    useCase = new CreateDeviceUseCase(
      mockUserRepository,
      mockDeviceRepository,
      mockDeviceTypeRepository
    )
  })

  describe('execute', () => {
    it('관리자만 기기를 등록할 수 있다', async () => {
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
        deviceTypeId: 'type-123',
        deviceNumber: 'PS5-001'
      })).rejects.toThrow('관리자만 기기를 등록할 수 있습니다')
    })

    it('존재하지 않는 기기 타입으로는 등록할 수 없다', async () => {
      // Given
      const admin = User.create({
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        phone: '010-1234-5678',
        role: 'admin'
      })
      mockUserRepository.findById.mockResolvedValue(admin)
      mockDeviceTypeRepository.findById.mockResolvedValue(null)

      // When & Then
      await expect(useCase.execute({
        userId: 'admin-123',
        deviceTypeId: 'non-existent',
        deviceNumber: 'PS5-001'
      })).rejects.toThrow('존재하지 않는 기기 타입입니다')
    })

    it('중복된 기기 번호로는 등록할 수 없다', async () => {
      // Given
      const admin = User.create({
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        phone: '010-1234-5678',
        role: 'admin'
      })
      mockUserRepository.findById.mockResolvedValue(admin)

      const deviceType = DeviceType.create({
        id: 'type-123',
        categoryId: 'category-123',
        name: 'PlayStation 5',
        hourlyRate: 10000,
        maxReservationHours: 12
      })
      mockDeviceTypeRepository.findById.mockResolvedValue(deviceType)
      mockDeviceRepository.existsByDeviceNumber.mockResolvedValue(true)

      // When & Then
      await expect(useCase.execute({
        userId: 'admin-123',
        deviceTypeId: 'type-123',
        deviceNumber: 'PS5-001'
      })).rejects.toThrow('기기 번호 PS5-001는 이미 사용 중입니다')
    })

    it('잘못된 형식의 기기 번호는 등록할 수 없다', async () => {
      // Given
      const admin = User.create({
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        phone: '010-1234-5678',
        role: 'admin'
      })
      mockUserRepository.findById.mockResolvedValue(admin)

      const deviceType = DeviceType.create({
        id: 'type-123',
        categoryId: 'category-123',
        name: 'PlayStation 5',
        hourlyRate: 10000,
        maxReservationHours: 12
      })
      mockDeviceTypeRepository.findById.mockResolvedValue(deviceType)
      mockDeviceRepository.existsByDeviceNumber.mockResolvedValue(false)

      // When & Then
      await expect(useCase.execute({
        userId: 'admin-123',
        deviceTypeId: 'type-123',
        deviceNumber: 'PS5 001' // 공백 포함
      })).rejects.toThrow('기기 번호는 영문자, 숫자, 하이픈(-)만 사용 가능합니다')

      await expect(useCase.execute({
        userId: 'admin-123',
        deviceTypeId: 'type-123',
        deviceNumber: 'PS' // 너무 짧음
      })).rejects.toThrow('기기 번호는 영문자, 숫자, 하이픈(-)만 사용 가능합니다')
    })

    it('기기를 성공적으로 등록한다', async () => {
      // Given
      const admin = User.create({
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        phone: '010-1234-5678',
        role: 'admin'
      })
      mockUserRepository.findById.mockResolvedValue(admin)

      const deviceType = DeviceType.create({
        id: 'type-123',
        categoryId: 'category-123',
        name: 'PlayStation 5',
        hourlyRate: 10000,
        maxReservationHours: 12
      })
      mockDeviceTypeRepository.findById.mockResolvedValue(deviceType)
      mockDeviceRepository.existsByDeviceNumber.mockResolvedValue(false)
      mockDeviceRepository.save.mockImplementation(device => Promise.resolve(device))

      const purchaseDate = '2025-01-15T00:00:00'

      // When
      const result = await useCase.execute({
        userId: 'admin-123',
        deviceTypeId: 'type-123',
        deviceNumber: 'PS5-001',
        location: '1층 A구역',
        serialNumber: 'SN123456789',
        purchaseDate: purchaseDate,
        notes: '초기 설치'
      })

      // Then
      expect(result.message).toBe('기기 PS5-001가 성공적으로 등록되었습니다')
      expect(result.device.deviceNumber).toBe('PS5-001')
      expect(result.device.deviceTypeId).toBe('type-123')
      expect(result.device.location).toBe('1층 A구역')
      expect(result.device.serialNumber).toBe('SN123456789')
      expect(result.device.purchaseDate).toEqual(new Date(purchaseDate))
      expect(result.device.notes).toBe('초기 설치')
      expect(result.device.status.value).toBe('available')

      expect(mockDeviceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceNumber: 'PS5-001',
          deviceTypeId: 'type-123'
        })
      )
    })
  })
})