import { AdjustReservationTimeUseCase } from '../adjust-time.use-case'
import { IUserRepository } from '../../../../domain/repositories/user.repository.interface'
import { IReservationRepository } from '../../../../domain/repositories/reservation.repository.interface'
import { IPaymentRepository } from '../../../../domain/repositories/payment.repository.interface'
import { INotificationRepository } from '../../../../domain/repositories/notification.repository.interface'
import { User } from '../../../../domain/entities/user'
import { Reservation } from '../../../../domain/entities/reservation'
import { Payment } from '../../../../domain/entities/payment'
import { KSTDateTime } from '../../../../domain/value-objects/kst-datetime'
import { TimeSlot } from '../../../../domain/value-objects/time-slot'
import { ReservationStatus } from '../../../../domain/value-objects/reservation-status'
import { TimeAdjustment } from '../../../../domain/value-objects/time-adjustment'

describe('AdjustReservationTimeUseCase', () => {
  let useCase: AdjustReservationTimeUseCase
  let mockUserRepository: jest.Mocked<IUserRepository>
  let mockReservationRepository: jest.Mocked<IReservationRepository>
  let mockPaymentRepository: jest.Mocked<IPaymentRepository>
  let mockNotificationRepository: jest.Mocked<INotificationRepository>

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

    mockPaymentRepository = {
      findByReservationId: jest.fn(),
      update: jest.fn()
    } as any

    mockNotificationRepository = {
      save: jest.fn()
    } as any

    useCase = new AdjustReservationTimeUseCase(
      mockUserRepository,
      mockReservationRepository,
      mockPaymentRepository,
      mockNotificationRepository
    )
  })

  describe('execute', () => {
    it('관리자만 시간을 조정할 수 있다', async () => {
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
        reservationId: 'reservation-456',
        actualStartTime: '2025-07-10T14:00:00',
        actualEndTime: '2025-07-10T17:00:00',
        reason: 'customer_extend'
      })).rejects.toThrow('관리자만 시간을 조정할 수 있습니다')
    })

    it('체크인된 예약만 시간 조정이 가능하다', async () => {
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
        reservationId: 'reservation-456',
        actualStartTime: '2025-07-10T14:00:00',
        actualEndTime: '2025-07-10T17:00:00',
        reason: 'customer_extend'
      })).rejects.toThrow('체크인된 예약만 시간 조정이 가능합니다')
    })

    it('종료 시간은 시작 시간보다 이후여야 한다', async () => {
      // Given
      const admin = User.create({
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        phone: '010-1234-5678',
        role: 'admin'
      })
      mockUserRepository.findById.mockResolvedValue(admin)

      const checkedInReservation = Reservation.create({
        id: 'reservation-456',
        userId: 'user-789',
        deviceId: 'device-type-1',
        date: KSTDateTime.fromString('2025-07-10 00:00:00'),
        timeSlot: TimeSlot.create(14, 16),
        status: ReservationStatus.checkedIn(),
        checkedInAt: new Date('2025-07-10T14:00:00')
      })
      mockReservationRepository.findById.mockResolvedValue(checkedInReservation)

      // When & Then
      await expect(useCase.execute({
        userId: 'admin-123',
        reservationId: 'reservation-456',
        actualStartTime: '2025-07-10T16:00:00',
        actualEndTime: '2025-07-10T14:00:00',
        reason: 'early_finish'
      })).rejects.toThrow('종료 시간은 시작 시간보다 이후여야 합니다')
    })

    it('시간을 성공적으로 조정하고 요금을 재계산한다 - 연장의 경우', async () => {
      // Given
      const admin = User.create({
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        phone: '010-1234-5678',
        role: 'admin'
      })
      mockUserRepository.findById.mockResolvedValue(admin)

      const customer = User.create({
        id: 'user-789',
        email: 'customer@example.com',
        name: 'Customer',
        phone: '010-9876-5432',
        role: 'user'
      })
      mockUserRepository.findById.mockResolvedValueOnce(admin)
      mockUserRepository.findById.mockResolvedValueOnce(customer)

      const checkedInReservation = Reservation.create({
        id: 'reservation-456',
        userId: 'user-789',
        deviceId: 'device-type-1',
        date: KSTDateTime.fromString('2025-07-10 00:00:00'),
        timeSlot: TimeSlot.create(14, 16), // 2시간 예약
        status: ReservationStatus.checkedIn(),
        assignedDeviceNumber: 'PS5-001',
        checkedInAt: new Date('2025-07-10T14:00:00'),
        actualStartTime: new Date('2025-07-10T14:00:00')
      })
      mockReservationRepository.findById.mockResolvedValue(checkedInReservation)

      const existingPayment = Payment.create({
        id: 'payment-123',
        userId: 'user-789',
        reservationId: 'reservation-456',
        amount: 20000, // 2시간 * 10,000원
        method: 'cash',
        status: 'pending'
      })
      mockPaymentRepository.findByReservationId.mockResolvedValue([existingPayment])
      mockPaymentRepository.update.mockImplementation(payment => Promise.resolve(payment))

      // When - 1시간 연장 (총 3시간)
      const result = await useCase.execute({
        userId: 'admin-123',
        reservationId: 'reservation-456',
        actualStartTime: '2025-07-10T14:00:00',
        actualEndTime: '2025-07-10T17:00:00', // 3시간
        reason: 'customer_extend',
        reasonDetail: '고객이 추가 1시간 이용을 요청함'
      })

      // Then
      expect(result.message).toContain('시간이 조정되었습니다')
      expect(result.message).toContain('고객 요청 연장')
      expect(result.reservation.actualStartTime?.toISOString()).toBe('2025-07-10T14:00:00.000Z')
      expect(result.reservation.actualEndTime?.toISOString()).toBe('2025-07-10T17:00:00.000Z')
      expect(result.timeAdjustment.originalDurationMinutes).toBe(120) // 2시간
      expect(result.timeAdjustment.actualDurationMinutes).toBe(180) // 3시간
      expect(result.timeAdjustment.adjustmentMinutes).toBe(60) // 1시간 연장
      expect(result.originalAmount).toBe(20000)
      expect(result.adjustedAmount).toBe(30000) // 3시간 * 10,000원

      expect(mockPaymentRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 30000
        })
      )

      expect(mockNotificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-789',
          type: 'time_adjusted',
          title: '이용 시간이 조정되었습니다'
        })
      )
    })

    it('시간을 성공적으로 조정하고 요금을 재계산한다 - 단축의 경우', async () => {
      // Given
      const admin = User.create({
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        phone: '010-1234-5678',
        role: 'admin'
      })
      mockUserRepository.findById.mockResolvedValue(admin)

      const customer = User.create({
        id: 'user-789',
        email: 'customer@example.com',
        name: 'Customer',
        phone: '010-9876-5432',
        role: 'user'
      })
      mockUserRepository.findById.mockResolvedValueOnce(admin)
      mockUserRepository.findById.mockResolvedValueOnce(customer)

      const checkedInReservation = Reservation.create({
        id: 'reservation-456',
        userId: 'user-789',
        deviceId: 'device-type-1',
        date: KSTDateTime.fromString('2025-07-10 00:00:00'),
        timeSlot: TimeSlot.create(14, 17), // 3시간 예약
        status: ReservationStatus.checkedIn(),
        assignedDeviceNumber: 'PS5-001',
        checkedInAt: new Date('2025-07-10T14:00:00'),
        actualStartTime: new Date('2025-07-10T14:00:00')
      })
      mockReservationRepository.findById.mockResolvedValue(checkedInReservation)

      const existingPayment = Payment.create({
        id: 'payment-123',
        userId: 'user-789',
        reservationId: 'reservation-456',
        amount: 30000, // 3시간 * 10,000원
        method: 'cash',
        status: 'pending'
      })
      mockPaymentRepository.findByReservationId.mockResolvedValue([existingPayment])
      mockPaymentRepository.update.mockImplementation(payment => Promise.resolve(payment))

      // When - 1시간 단축 (총 2시간)
      const result = await useCase.execute({
        userId: 'admin-123',
        reservationId: 'reservation-456',
        actualStartTime: '2025-07-10T14:00:00',
        actualEndTime: '2025-07-10T16:00:00', // 2시간
        reason: 'early_finish',
        reasonDetail: '고객이 조기 종료를 요청함'
      })

      // Then
      expect(result.timeAdjustment.originalDurationMinutes).toBe(180) // 3시간
      expect(result.timeAdjustment.actualDurationMinutes).toBe(120) // 2시간
      expect(result.timeAdjustment.adjustmentMinutes).toBe(-60) // 1시간 단축
      expect(result.originalAmount).toBe(30000)
      expect(result.adjustedAmount).toBe(20000) // 2시간 * 10,000원

      expect(mockPaymentRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 20000
        })
      )
    })

    it('30분 단위로 올림 처리하여 요금을 계산한다', async () => {
      // Given
      const admin = User.create({
        id: 'admin-123',
        email: 'admin@example.com',
        name: 'Admin User',
        phone: '010-1234-5678',
        role: 'admin'
      })
      mockUserRepository.findById.mockResolvedValue(admin)

      const customer = User.create({
        id: 'user-789',
        email: 'customer@example.com',
        name: 'Customer',
        phone: '010-9876-5432',
        role: 'user'
      })
      mockUserRepository.findById.mockResolvedValueOnce(admin)
      mockUserRepository.findById.mockResolvedValueOnce(customer)

      const checkedInReservation = Reservation.create({
        id: 'reservation-456',
        userId: 'user-789',
        deviceId: 'device-type-1',
        date: KSTDateTime.fromString('2025-07-10 00:00:00'),
        timeSlot: TimeSlot.create(14, 16), // 2시간 예약
        status: ReservationStatus.checkedIn(),
        assignedDeviceNumber: 'PS5-001',
        checkedInAt: new Date('2025-07-10T14:00:00'),
        actualStartTime: new Date('2025-07-10T14:00:00')
      })
      mockReservationRepository.findById.mockResolvedValue(checkedInReservation)

      const existingPayment = Payment.create({
        id: 'payment-123',
        userId: 'user-789',
        reservationId: 'reservation-456',
        amount: 20000, // 2시간 * 10,000원
        method: 'cash',
        status: 'pending'
      })
      mockPaymentRepository.findByReservationId.mockResolvedValue([existingPayment])
      mockPaymentRepository.update.mockImplementation(payment => Promise.resolve(payment))

      // When - 2시간 10분 사용 (30분 단위 올림으로 2.5시간 요금)
      const result = await useCase.execute({
        userId: 'admin-123',
        reservationId: 'reservation-456',
        actualStartTime: '2025-07-10T14:00:00',
        actualEndTime: '2025-07-10T16:10:00', // 2시간 10분
        reason: 'customer_extend',
        reasonDetail: '10분 추가 이용'
      })

      // Then
      expect(result.timeAdjustment.actualDurationMinutes).toBe(130) // 2시간 10분
      expect(result.timeAdjustment.chargeableMinutes).toBe(150) // 2.5시간 (30분 올림)
      expect(result.adjustedAmount).toBe(25000) // 2.5시간 * 10,000원
    })
  })
})