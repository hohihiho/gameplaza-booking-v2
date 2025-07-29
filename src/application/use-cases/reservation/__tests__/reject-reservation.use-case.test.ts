import { RejectReservationUseCase } from '../reject-reservation.use-case'
import { IUserRepository } from '../../../../domain/repositories/user.repository.interface'
import { IReservationRepository } from '../../../../domain/repositories/reservation.repository.interface'
import { INotificationRepository } from '../../../../domain/repositories/notification.repository.interface'
import { User } from '../../../../domain/entities/user'
import { Reservation } from '../../../../domain/entities/reservation'
import { KSTDateTime } from '../../../../domain/value-objects/kst-datetime'
import { TimeSlot } from '../../../../domain/value-objects/time-slot'
import { ReservationStatus } from '../../../../domain/value-objects/reservation-status'

describe('RejectReservationUseCase', () => {
  let useCase: RejectReservationUseCase
  let mockUserRepository: jest.Mocked<IUserRepository>
  let mockReservationRepository: jest.Mocked<IReservationRepository>
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

    mockNotificationRepository = {
      save: jest.fn()
    } as any

    useCase = new RejectReservationUseCase(
      mockUserRepository,
      mockReservationRepository,
      mockNotificationRepository
    )
  })

  describe('execute', () => {
    it('관리자만 예약을 거절할 수 있다', async () => {
      // Given
      const normalUser = User.create({
        id: 'user-123',
        email: 'user@example.com',
        fullName: 'Normal User',
        phone: '010-1234-5678',
        role: 'user',
        birthDate: new Date('1990-01-01')
      })
      mockUserRepository.findById.mockResolvedValue(normalUser)

      // When & Then
      await expect(useCase.execute({
        userId: 'user-123',
        reservationId: 'reservation-456',
        reason: '기기 점검'
      })).rejects.toThrow('관리자만 예약을 거절할 수 있습니다')
    })

    it('거절 사유는 필수이다', async () => {
      // Given
      const admin = User.create({
        id: 'admin-123',
        email: 'admin@example.com',
        fullName: 'Admin User',
        phone: '010-1234-5678',
        role: 'admin',
        birthDate: new Date('1990-01-01')
      })
      mockUserRepository.findById.mockResolvedValue(admin)

      // When & Then
      await expect(useCase.execute({
        userId: 'admin-123',
        reservationId: 'reservation-456',
        reason: ''
      })).rejects.toThrow('거절 사유는 필수입니다')

      await expect(useCase.execute({
        userId: 'admin-123',
        reservationId: 'reservation-456',
        reason: '   '
      })).rejects.toThrow('거절 사유는 필수입니다')
    })

    it('대기 중인 예약만 거절할 수 있다', async () => {
      // Given
      const admin = User.create({
        id: 'admin-123',
        email: 'admin@example.com',
        fullName: 'Admin User',
        phone: '010-1234-5678',
        role: 'admin',
        birthDate: new Date('1990-01-01')
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
        reason: '기기 점검'
      })).rejects.toThrow('대기 중인 예약만 거절할 수 있습니다')
    })

    it('예약을 성공적으로 거절하고 알림을 발송한다', async () => {
      // Given
      const admin = User.create({
        id: 'admin-123',
        email: 'admin@example.com',
        fullName: 'Admin User',
        phone: '010-1234-5678',
        role: 'admin',
        birthDate: new Date('1990-01-01')
      })
      mockUserRepository.findById.mockResolvedValue(admin)

      const reservationUser = User.create({
        id: 'user-789',
        email: 'user@example.com',
        fullName: 'Reservation User',
        phone: '010-9876-5432',
        role: 'user',
        birthDate: new Date('1990-01-01')
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

      const rejectionReason = '해당 시간대 기기 점검으로 인한 예약 불가'

      // When
      const result = await useCase.execute({
        userId: 'admin-123',
        reservationId: 'reservation-456',
        reason: rejectionReason
      })

      // Then
      expect(result.message).toContain('예약이 거절되었습니다')
      expect(result.message).toContain(rejectionReason)
      expect(result.reservation.status.value).toBe('rejected')
      expect(result.reservation.rejectionReason).toBe(rejectionReason)

      expect(mockReservationRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'reservation-456',
          status: expect.objectContaining({ value: 'rejected' }),
          rejectionReason: rejectionReason
        })
      )

      // 알림 저장 호출 검증 (간단히 호출 여부만 확인)
      expect(mockNotificationRepository.save).toHaveBeenCalled()
    })

    it('예약을 찾을 수 없으면 에러 발생', async () => {
      // Given
      const admin = User.create({
        id: 'admin-123',
        email: 'admin@example.com',
        fullName: 'Admin User',
        phone: '010-1234-5678',
        role: 'admin',
        birthDate: new Date('1990-01-01')
      })
      mockUserRepository.findById.mockResolvedValue(admin)
      mockReservationRepository.findById.mockResolvedValue(null)

      // When & Then
      await expect(useCase.execute({
        userId: 'admin-123',
        reservationId: 'non-existent',
        reason: '기기 점검'
      })).rejects.toThrow('예약을 찾을 수 없습니다')
    })
  })
})