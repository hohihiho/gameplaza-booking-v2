import { ReservationService } from '../reservation.service'
import { IReservationRepository } from '../../repositories/reservation.repository.interface'
import { IDeviceRepository } from '../../repositories/device.repository.interface'
import { Reservation } from '../../entities/reservation'
import { User } from '../../entities/user'
import { Device } from '../../entities/device'
import { KSTDateTime } from '../../value-objects/kst-datetime'
import { TimeSlot } from '../../value-objects/time-slot'
import { ReservationStatus } from '../../value-objects/reservation-status'
import { DeviceStatus } from '../../value-objects/device-status'

describe('ReservationService', () => {
  let service: ReservationService
  let mockReservationRepo: jest.Mocked<IReservationRepository>
  let mockDeviceRepo: jest.Mocked<IDeviceRepository>
  
  const mockUser = User.create({
    id: 'user-1',
    email: 'test@example.com',
    fullName: 'Test User'
  })
  
  const mockAdmin = User.create({
    id: 'admin-1',
    email: 'admin@example.com',
    fullName: 'Admin User',
    role: 'admin'
  })
  
  const mockDevice = Device.create({
    id: 'device-1',
    deviceTypeId: 'type-1',
    deviceNumber: 'PC-001',
    status: DeviceStatus.available()
  })

  beforeEach(() => {
    mockReservationRepo = {
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
    
    mockDeviceRepo = {
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
    
    service = new ReservationService(mockReservationRepo, mockDeviceRepo)
  })

  describe('createReservation', () => {
    // 24시간 규칙 통과를 위해 미래 날짜 사용
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 2) // 2일 후
    const dateString = futureDate.toISOString().split('T')[0]
    
    const dto = {
      userId: 'user-1',
      deviceId: 'device-1',
      date: dateString,
      timeSlot: '14:00-16:00'
    }

    beforeEach(() => {
      mockDeviceRepo.findDeviceById.mockResolvedValue(mockDevice)
      mockReservationRepo.findActiveByDeviceIdAndDate.mockResolvedValue([])
      mockReservationRepo.findActiveByUserId.mockResolvedValue([])
      mockReservationRepo.save.mockImplementation(async (res) => res)
    })

    it('should create reservation successfully', async () => {
      const result = await service.createReservation(dto, mockUser)
      
      expect(result.userId).toBe('user-1')
      expect(result.deviceId).toBe('device-1')
      expect(result.status.value).toBe('pending')
      expect(mockReservationRepo.save).toHaveBeenCalled()
    })

    it('should throw error if device not found', async () => {
      mockDeviceRepo.findDeviceById.mockResolvedValue(null)
      
      await expect(service.createReservation(dto, mockUser))
        .rejects.toThrow('Device not found')
    })

    it('should throw error if device not available', async () => {
      const unavailableDevice = Device.create({
        id: 'device-1',
        deviceTypeId: 'type-1',
        deviceNumber: 'PC-001',
        status: DeviceStatus.maintenance()
      })
      mockDeviceRepo.findDeviceById.mockResolvedValue(unavailableDevice)
      
      await expect(service.createReservation(dto, mockUser))
        .rejects.toThrow('Device is not available')
    })

    it('should throw error for 24-hour rule violation', async () => {
      const tomorrow = {
        ...dto,
        date: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
      
      await expect(service.createReservation(tomorrow, mockUser))
        .rejects.toThrow('Reservations must be made at least 24 hours in advance')
    })

    it('should throw error for time conflict', async () => {
      const existingReservation = Reservation.create({
        id: 'existing-1',
        userId: 'other-user',
        deviceId: 'device-1',
        date: KSTDateTime.fromString(dateString),
        timeSlot: TimeSlot.create(14, 16)
      })
      
      mockReservationRepo.findActiveByDeviceIdAndDate.mockResolvedValue([existingReservation])
      
      await expect(service.createReservation(dto, mockUser))
        .rejects.toThrow('Time slot is already reserved')
    })

    it('should throw error for 1-person-1-device rule violation', async () => {
      const existingReservation = Reservation.create({
        id: 'existing-1',
        userId: 'user-1',
        deviceId: 'device-2',
        date: KSTDateTime.fromString(dateString),
        timeSlot: TimeSlot.create(14, 16),
        status: ReservationStatus.create('approved')
      })
      
      mockReservationRepo.findActiveByUserId.mockResolvedValue([existingReservation])
      
      await expect(service.createReservation(dto, mockUser))
        .rejects.toThrow('You already have a reservation for this time slot')
    })
  })

  describe('approveReservation', () => {
    const mockReservation = Reservation.create({
      id: 'res-1',
      userId: 'user-1',
      deviceId: 'device-1',
      date: KSTDateTime.fromString('2025-07-25'),
      timeSlot: TimeSlot.create(14, 16)
    })

    it('should approve reservation as admin', async () => {
      mockReservationRepo.findById.mockResolvedValue(mockReservation)
      mockReservationRepo.update.mockImplementation(async (res) => res)
      
      const result = await service.approveReservation('res-1', mockAdmin)
      
      expect(result.status.value).toBe('approved')
      expect(mockReservationRepo.update).toHaveBeenCalled()
    })

    it('should throw error if not admin', async () => {
      await expect(service.approveReservation('res-1', mockUser))
        .rejects.toThrow('Only admins can approve reservations')
    })

    it('should throw error if reservation not found', async () => {
      mockReservationRepo.findById.mockResolvedValue(null)
      
      await expect(service.approveReservation('res-1', mockAdmin))
        .rejects.toThrow('Reservation not found')
    })
  })

  describe('cancelReservation', () => {
    const mockReservation = Reservation.create({
      id: 'res-1',
      userId: 'user-1',
      deviceId: 'device-1',
      date: KSTDateTime.fromString('2025-07-25'),
      timeSlot: TimeSlot.create(14, 16)
    })

    it('should allow user to cancel own reservation', async () => {
      mockReservationRepo.findById.mockResolvedValue(mockReservation)
      mockReservationRepo.update.mockImplementation(async (res) => res)
      
      const result = await service.cancelReservation('res-1', mockUser)
      
      expect(result.status.value).toBe('cancelled')
    })

    it('should allow admin to cancel any reservation', async () => {
      mockReservationRepo.findById.mockResolvedValue(mockReservation)
      mockReservationRepo.update.mockImplementation(async (res) => res)
      
      const result = await service.cancelReservation('res-1', mockAdmin)
      
      expect(result.status.value).toBe('cancelled')
    })

    it('should throw error if non-owner tries to cancel', async () => {
      const otherUser = User.create({
        id: 'user-2',
        email: 'other@example.com',
        fullName: 'Other User'
      })
      
      mockReservationRepo.findById.mockResolvedValue(mockReservation)
      
      await expect(service.cancelReservation('res-1', otherUser))
        .rejects.toThrow('You can only cancel your own reservations')
    })
  })

  describe('checkIn', () => {
    const approvedReservation = Reservation.create({
      id: 'res-1',
      userId: 'user-1',
      deviceId: 'device-1',
      date: KSTDateTime.fromString('2025-07-25'),
      timeSlot: TimeSlot.create(14, 16)
    }).assignDevice('PC-001').approve()

    it('should check in reservation as admin', async () => {
      mockReservationRepo.findById.mockResolvedValue(approvedReservation)
      mockReservationRepo.update.mockImplementation(async (res) => res)
      
      const result = await service.checkIn('res-1', mockAdmin)
      
      expect(result.status.value).toBe('checked_in')
    })

    it('should throw error if not admin', async () => {
      await expect(service.checkIn('res-1', mockUser))
        .rejects.toThrow('Only admins can check in reservations')
    })
  })
})