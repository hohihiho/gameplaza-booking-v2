import { CheckInReservationUseCase } from '../check-in.use-case'
import { IUserRepository } from '../../../../domain/repositories/user.repository.interface'
import { IReservationRepository } from '../../../../domain/repositories/reservation.repository.interface'
import { IDeviceRepository } from '../../../../domain/repositories/device.repository.interface'
import { IPaymentRepository } from '../../../../domain/repositories/payment.repository.interface'
import { INotificationRepository } from '../../../../domain/repositories/notification.repository.interface'
import { CheckInRepository } from '../../../../domain/repositories/check-in.repository.interface'
import { User } from '../../../../domain/entities/user'
import { Reservation } from '../../../../domain/entities/reservation'
import { Device } from '../../../../domain/entities/device'
import { Payment } from '../../../../domain/entities/payment'
import { KSTDateTime } from '../../../../domain/value-objects/kst-datetime'
import { TimeSlot } from '../../../../domain/value-objects/time-slot'
import { ReservationStatus } from '../../../../domain/value-objects/reservation-status'
import { DeviceStatus } from '../../../../domain/value-objects/device-status'

describe('CheckInReservationUseCase', () => {
  let useCase: CheckInReservationUseCase
  let mockUserRepository: jest.Mocked<IUserRepository>
  let mockReservationRepository: jest.Mocked<IReservationRepository>
  let mockDeviceRepository: jest.Mocked<IDeviceRepository>
  let mockPaymentRepository: jest.Mocked<IPaymentRepository>
  let mockNotificationRepository: jest.Mocked<INotificationRepository>
  let mockCheckInRepository: jest.Mocked<CheckInRepository>

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn()
    } as any

    mockReservationRepository = {
      findById: jest.fn(),
      update: jest.fn()
    } as any

    mockDeviceRepository = {
      findByDeviceNumber: jest.fn(),
      update: jest.fn()
    } as any

    mockPaymentRepository = {
      findByReservationId: jest.fn(),
      save: jest.fn()
    } as any

    mockNotificationRepository = {
      save: jest.fn()
    } as any

    mockCheckInRepository = {
      save: jest.fn()
    } as any

    useCase = new CheckInReservationUseCase(
      mockUserRepository,
      mockReservationRepository,
      mockDeviceRepository,
      mockPaymentRepository,
      mockNotificationRepository,
      mockCheckInRepository
    )
  })

  describe('execute', () => {
    it('관리자 또는 스태프만 체크인을 처리할 수 있다', async () => {
      // Given
      const normalUser = User.create({
        id: 'user-123',
        email: 'user@example.com',
        fullName: 'Normal User',
        phone: '010-1234-5678',
        role: 'user'
      })
      mockUserRepository.findById.mockResolvedValue(normalUser)

      // When & Then
      await expect(useCase.execute({
        userId: 'user-123',
        reservationId: 'reservation-456'
      })).rejects.toThrow('관리자 또는 스태프만 체크인을 처리할 수 있습니다')
    })

    it('승인된 예약만 체크인할 수 있다', async () => {
      // Given
      const staff = User.create({
        id: 'staff-123',
        email: 'staff@example.com',
        fullName: 'Staff User',
        phone: '010-1234-5678',
        role: 'staff'
      })
      mockUserRepository.findById.mockResolvedValue(staff)

      const pendingReservation = Reservation.create({
        id: 'reservation-456',
        userId: 'user-789',
        deviceId: 'device-type-1',
        date: KSTDateTime.fromString('2025-07-10 00:00:00'),
        timeSlot: TimeSlot.create(14, 16),
        status: ReservationStatus.pending()
      })
      mockReservationRepository.findById.mockResolvedValue(pendingReservation)

      // When & Then
      await expect(useCase.execute({
        userId: 'staff-123',
        reservationId: 'reservation-456'
      })).rejects.toThrow('승인된 예약만 체크인할 수 있습니다')
    })

    it('기기가 배정되지 않은 예약은 체크인할 수 없다', async () => {
      // Given
      const admin = User.create({
        id: 'admin-123',
        email: 'admin@example.com',
        fullName: 'Admin User',
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
      })).rejects.toThrow('기기가 배정되지 않은 예약입니다')
    })

    it('예약 시작 1시간 전부터만 체크인이 가능하다', async () => {
      // Given
      const admin = User.create({
        id: 'admin-123',
        email: 'admin@example.com',
        fullName: 'Admin User',
        phone: '010-1234-5678',
        role: 'admin'
      })
      mockUserRepository.findById.mockResolvedValue(admin)

      // 2시간 후의 예약
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 2)
      const [year, month, day] = [futureDate.getFullYear(), futureDate.getMonth() + 1, futureDate.getDate()]
      const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} 00:00:00`
      
      const futureReservation = Reservation.create({
        id: 'reservation-456',
        userId: 'user-789',
        deviceId: 'device-type-1',
        date: KSTDateTime.fromString(dateString),
        timeSlot: TimeSlot.create(futureDate.getHours(), futureDate.getHours() + 2),
        status: ReservationStatus.approved(),
        assignedDeviceNumber: 'PS5-001'
      })
      mockReservationRepository.findById.mockResolvedValue(futureReservation)

      const device = Device.create({
        id: 'device-123',
        deviceTypeId: 'device-type-1',
        deviceNumber: 'PS5-001',
        status: DeviceStatus.available()
      })
      mockDeviceRepository.findByDeviceNumber.mockResolvedValue(device)

      // When & Then
      await expect(useCase.execute({
        userId: 'admin-123',
        reservationId: 'reservation-456'
      })).rejects.toThrow('예약 시작 1시간 전부터 체크인이 가능합니다')
    })

    it('체크인 시 기기 상태를 사용 중으로 변경하고 현장 결제를 생성한다', async () => {
      // Given
      const admin = User.create({
        id: 'admin-123',
        email: 'admin@example.com',
        fullName: 'Admin User',
        phone: '010-1234-5678',
        role: 'admin'
      })
      mockUserRepository.findById.mockResolvedValue(admin)

      const customer = User.create({
        id: 'user-789',
        email: 'customer@example.com',
        fullName: 'Customer',
        phone: '010-9876-5432',
        role: 'user'
      })
      mockUserRepository.findById.mockResolvedValueOnce(admin)
      mockUserRepository.findById.mockResolvedValueOnce(customer)

      // 현재 시간 기준 예약
      const now = new Date()
      const [year, month, day] = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
      const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} 00:00:00`
      
      const approvedReservation = Reservation.create({
        id: 'reservation-456',
        userId: 'user-789',
        deviceId: 'device-type-1',
        date: KSTDateTime.fromString(dateString),
        timeSlot: TimeSlot.create(now.getHours(), now.getHours() + 2),
        status: ReservationStatus.approved(),
        assignedDeviceNumber: 'PS5-001',
        reservationNumber: 'GP-20250710-1234'
      })
      mockReservationRepository.findById.mockResolvedValue(approvedReservation)

      const device = Device.create({
        id: 'device-123',
        deviceTypeId: 'device-type-1',
        deviceNumber: 'PS5-001',
        status: DeviceStatus.available()
      })
      mockDeviceRepository.findByDeviceNumber.mockResolvedValue(device)
      mockPaymentRepository.findByReservationId.mockResolvedValue([])

      // When
      const result = await useCase.execute({
        userId: 'admin-123',
        reservationId: 'reservation-456',
        paymentMethod: 'cash'
      })

      // Then
      expect(result.message).toContain('체크인이 완료되었습니다')
      expect(result.assignedDevice).toBe('PS5-001')
      expect(result.reservation.status.value).toBe('checked_in')
      expect(result.reservation.checkedInAt).toBeTruthy()
      expect(result.reservation.actualStartTime).toBeTruthy()
      expect(result.payment).toBeTruthy()
      expect(result.payment?.method).toBe('cash')
      expect(result.payment?.status).toBe('pending')

      expect(mockDeviceRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceNumber: 'PS5-001',
          status: expect.objectContaining({ value: 'in_use' })
        })
      )

      expect(mockReservationRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'reservation-456',
          status: expect.objectContaining({ value: 'checked_in' })
        })
      )

      expect(mockPaymentRepository.save).toHaveBeenCalled()
      expect(mockNotificationRepository.save).toHaveBeenCalled()
    })

    it('이미 결제가 있는 경우 새로운 결제를 생성하지 않는다', async () => {
      // Given
      const admin = User.create({
        id: 'admin-123',
        email: 'admin@example.com',
        fullName: 'Admin User',
        phone: '010-1234-5678',
        role: 'admin'
      })
      mockUserRepository.findById.mockResolvedValue(admin)

      const customer = User.create({
        id: 'user-789',
        email: 'customer@example.com',
        fullName: 'Customer',
        phone: '010-9876-5432',
        role: 'user'
      })
      mockUserRepository.findById.mockResolvedValueOnce(admin)
      mockUserRepository.findById.mockResolvedValueOnce(customer)

      // 현재 시간 기준 예약
      const now = new Date()
      const [year, month, day] = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
      const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} 00:00:00`
      
      const approvedReservation = Reservation.create({
        id: 'reservation-456',
        userId: 'user-789',
        deviceId: 'device-type-1',
        date: KSTDateTime.fromString(dateString),
        timeSlot: TimeSlot.create(now.getHours(), now.getHours() + 2),
        status: ReservationStatus.approved(),
        assignedDeviceNumber: 'PS5-001',
        reservationNumber: 'GP-20250710-1234'
      })
      mockReservationRepository.findById.mockResolvedValue(approvedReservation)

      const device = Device.create({
        id: 'device-123',
        deviceTypeId: 'device-type-1',
        deviceNumber: 'PS5-001',
        status: DeviceStatus.available()
      })
      mockDeviceRepository.findByDeviceNumber.mockResolvedValue(device)

      const existingPayment = Payment.create({
        id: 'payment-123',
        userId: 'user-789',
        reservationId: 'reservation-456',
        amount: 20000,
        method: 'bank_transfer',
        status: 'pending'
      })
      mockPaymentRepository.findByReservationId.mockResolvedValue([existingPayment])

      // When
      const result = await useCase.execute({
        userId: 'admin-123',
        reservationId: 'reservation-456'
      })

      // Then
      expect(result.payment).toBe(existingPayment)
      expect(mockPaymentRepository.save).not.toHaveBeenCalled()
    })
  })
})