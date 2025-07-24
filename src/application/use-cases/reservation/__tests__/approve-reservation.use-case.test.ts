import { ApproveReservationUseCase } from '../approve-reservation.use-case'
import { IUserRepository } from '../../../../domain/repositories/user.repository.interface'
import { IReservationRepository } from '../../../../domain/repositories/reservation.repository.interface'
import { IDeviceRepository } from '../../../../domain/repositories/device.repository.interface'
import { INotificationRepository } from '../../../../domain/repositories/notification.repository.interface'
import { User } from '../../../../domain/entities/user'
import { Reservation } from '../../../../domain/entities/reservation'
import { Device } from '../../../../domain/entities/device'
import { KSTDateTime } from '../../../../domain/value-objects/kst-datetime'
import { TimeSlot } from '../../../../domain/value-objects/time-slot'
import { ReservationStatus } from '../../../../domain/value-objects/reservation-status'

describe('ApproveReservationUseCase', () => {
  let useCase: ApproveReservationUseCase
  let mockUserRepository: jest.Mocked<IUserRepository>
  let mockReservationRepository: jest.Mocked<IReservationRepository>
  let mockDeviceRepository: jest.Mocked<IDeviceRepository>
  let mockNotificationRepository: jest.Mocked<INotificationRepository>

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn()
    } as any

    mockReservationRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      findByDeviceAndTimeSlot: jest.fn()
    } as any

    mockDeviceRepository = {
      findByTypeId: jest.fn()
    } as any

    mockNotificationRepository = {
      save: jest.fn()
    } as any

    useCase = new ApproveReservationUseCase(
      mockUserRepository,
      mockReservationRepository,
      mockDeviceRepository,
      mockNotificationRepository
    )
  })

  describe('execute', () => {
    it('관리자만 예약을 승인할 수 있다', async () => {
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
        reservationId: 'reservation-456'
      })).rejects.toThrow('관리자만 예약을 승인할 수 있습니다')
    })

    it('대기 중인 예약만 승인할 수 있다', async () => {
      // Given
      const admin = User.create({
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        phone: '010-1234-5678',
        role: 'admin'
      })
      mockUserRepository.findById.mockResolvedValue(admin)

      const approvedReservation = Reservation.create({
        id: 'reservation-456',
        userId: 'user-789',
        deviceId: 'device-type-1',
        date: KSTDateTime.fromString('2025-07-10 00:00:00'),
        timeSlot: TimeSlot.create(14, 16),
        status: ReservationStatus.approved()
      })
      mockReservationRepository.findById.mockResolvedValue(approvedReservation)

      // When & Then
      await expect(useCase.execute({
        userId: 'admin-123',
        reservationId: 'reservation-456'
      })).rejects.toThrow('대기 중인 예약만 승인할 수 있습니다')
    })

    it('사용 가능한 기기가 없으면 에러 발생', async () => {
      // Given
      const admin = User.create({
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        phone: '010-1234-5678',
        role: 'admin'
      })
      mockUserRepository.findById.mockResolvedValue(admin)

      const pendingReservation = Reservation.create({
        id: 'reservation-456',
        userId: 'user-789',
        deviceId: 'device-type-1',
        date: KSTDateTime.fromString('2025-07-10 00:00:00'),
        timeSlot: TimeSlot.create(14, 16),
        status: ReservationStatus.pending()
      })
      mockReservationRepository.findById.mockResolvedValue(pendingReservation)

      // 사용 가능한 기기가 없음
      mockDeviceRepository.findByTypeId.mockResolvedValue([])

      // When & Then
      await expect(useCase.execute({
        userId: 'admin-123',
        reservationId: 'reservation-456'
      })).rejects.toThrow('사용 가능한 기기가 없습니다')
    })

    it('예약을 성공적으로 승인하고 기기 번호를 할당한다', async () => {
      // Given
      const admin = User.create({
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        phone: '010-1234-5678',
        role: 'admin'
      })
      mockUserRepository.findById.mockResolvedValue(admin)

      const reservationUser = User.create({
        id: 'user-789',
        email: 'user@example.com',
        name: 'Reservation User',
        phone: '010-9876-5432',
        role: 'user'
      })
      mockUserRepository.findById.mockResolvedValueOnce(admin)
      mockUserRepository.findById.mockResolvedValueOnce(reservationUser)

      const pendingReservation = Reservation.create({
        id: 'reservation-456',
        userId: 'user-789',
        deviceId: 'device-type-1',
        date: KSTDateTime.fromString('2025-07-10 00:00:00'),
        timeSlot: TimeSlot.create(14, 16),
        status: ReservationStatus.pending(),
        reservationNumber: 'GP-20250710-1234'
      })
      mockReservationRepository.findById.mockResolvedValue(pendingReservation)

      const device1 = Device.create({
        id: 'device-1',
        deviceTypeId: 'device-type-1',
        deviceNumber: '#1',
        status: 'available'
      })
      const device2 = Device.create({
        id: 'device-2',
        deviceTypeId: 'device-type-1',
        deviceNumber: '#2',
        status: 'available'
      })
      mockDeviceRepository.findByTypeId.mockResolvedValue([device1, device2])

      // 첫 번째 기기는 이미 예약이 있고, 두 번째 기기는 사용 가능
      mockReservationRepository.findByDeviceAndTimeSlot
        .mockResolvedValueOnce([pendingReservation]) // device1은 이미 예약이 있음
        .mockResolvedValueOnce([]) // device2는 사용 가능

      // When
      const result = await useCase.execute({
        userId: 'admin-123',
        reservationId: 'reservation-456'
      })

      // Then
      expect(result.assignedDeviceNumber).toBe('#2')
      expect(result.message).toContain('예약이 승인되었습니다')
      expect(result.message).toContain('#2')
      expect(result.reservation.status.value).toBe('approved')
      expect(result.reservation.assignedDeviceNumber).toBe('#2')

      expect(mockReservationRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'reservation-456',
          status: expect.objectContaining({ value: 'approved' }),
          assignedDeviceNumber: '#2'
        })
      )

      expect(mockNotificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-789',
          type: 'reservation_approved',
          title: '예약이 승인되었습니다'
        })
      )
    })
  })
})