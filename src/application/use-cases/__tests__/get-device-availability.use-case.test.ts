import { GetDeviceAvailabilityUseCase } from '../get-device-availability.use-case'
import { IReservationRepository } from '../../../domain/repositories/reservation.repository.interface'
import { IDeviceRepository } from '../../../domain/repositories/device.repository.interface'
import { Device } from '../../../domain/entities/device'
import { Reservation } from '../../../domain/entities/reservation'
import { KSTDateTime } from '../../../domain/value-objects/kst-datetime'
import { TimeSlot } from '../../../domain/value-objects/time-slot'
import { ReservationStatus } from '../../../domain/value-objects/reservation-status'

describe('GetDeviceAvailabilityUseCase', () => {
  let useCase: GetDeviceAvailabilityUseCase
  let mockReservationRepository: jest.Mocked<IReservationRepository>
  let mockDeviceRepository: jest.Mocked<IDeviceRepository>

  const mockDevice = Device.create({
    id: 'device-1',
    deviceTypeId: 'type-1',
    deviceNumber: 'PC-001'
  })

  beforeEach(() => {
    mockReservationRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByDeviceId: jest.fn(),
      findByDate: jest.fn(),
      findActiveByUserId: jest.fn(),
      findActiveByDeviceIdAndDate: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }

    mockDeviceRepository = {
      findDeviceById: jest.fn(),
      findDevicesByTypeId: jest.fn(),
      findAvailableDevicesByTypeId: jest.fn(),
      saveDevice: jest.fn(),
      updateDevice: jest.fn(),
      findTypeById: jest.fn(),
      findTypesByCategoryId: jest.fn(),
      saveType: jest.fn(),
      findCategoryById: jest.fn(),
      findAllCategories: jest.fn(),
      saveCategory: jest.fn()
    }

    useCase = new GetDeviceAvailabilityUseCase(
      mockReservationRepository,
      mockDeviceRepository
    )
  })

  describe('execute', () => {
    it('should return all slots as available when no reservations', async () => {
      mockDeviceRepository.findDeviceById.mockResolvedValue(mockDevice)
      mockReservationRepository.findActiveByDeviceIdAndDate.mockResolvedValue([])

      const result = await useCase.execute('device-1', '2025-07-25')

      expect(result.deviceId).toBe('device-1')
      expect(result.date).toBe('2025-07-25')
      expect(result.availableTimeSlots).toHaveLength(9) // 10-28시, 2시간 단위
      expect(result.reservedTimeSlots).toHaveLength(0)
      expect(result.availableTimeSlots).toContain('14:00-16:00')
      expect(result.availableTimeSlots).toContain('26:00-28:00')
    })

    it('should mark reserved slots correctly', async () => {
      const reservation1 = Reservation.create({
        id: 'res-1',
        userId: 'user-1',
        deviceId: 'device-1',
        date: KSTDateTime.fromString('2025-07-25'),
        timeSlot: TimeSlot.create(14, 16),
        status: ReservationStatus.create('approved')
      })

      const reservation2 = Reservation.create({
        id: 'res-2',
        userId: 'user-2',
        deviceId: 'device-1',
        date: KSTDateTime.fromString('2025-07-25'),
        timeSlot: TimeSlot.create(18, 20),
        status: ReservationStatus.create('approved')
      })

      mockDeviceRepository.findDeviceById.mockResolvedValue(mockDevice)
      mockReservationRepository.findActiveByDeviceIdAndDate.mockResolvedValue([
        reservation1,
        reservation2
      ])

      const result = await useCase.execute('device-1', '2025-07-25')

      expect(result.reservedTimeSlots).toHaveLength(2)
      expect(result.reservedTimeSlots).toContain('14:00-16:00')
      expect(result.reservedTimeSlots).toContain('18:00-20:00')
      expect(result.availableTimeSlots).toHaveLength(7)
      expect(result.availableTimeSlots).not.toContain('14:00-16:00')
      expect(result.availableTimeSlots).not.toContain('18:00-20:00')
    })

    it('should throw error if device not found', async () => {
      mockDeviceRepository.findDeviceById.mockResolvedValue(null)

      await expect(useCase.execute('device-1', '2025-07-25'))
        .rejects.toThrow('Device not found')
    })
  })
})