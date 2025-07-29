import { HandleNoShowUseCase } from '../handle-no-show.use-case'
import { ReservationRepository } from '@/src/domain/repositories/reservation-repository.interface'
import { CheckInRepository } from '@/src/domain/repositories/checkin-repository.interface'
import { UserRepository } from '@/src/domain/repositories/user-repository.interface'
import { Reservation } from '@/src/domain/entities/reservation'
import { CheckIn } from '@/src/domain/entities/checkin'
import { User } from '@/src/domain/entities/user'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'
import { TimeSlot } from '@/src/domain/value-objects/time-slot'

describe('HandleNoShowUseCase', () => {
  let useCase: HandleNoShowUseCase
  let mockReservationRepository: jest.Mocked<ReservationRepository>
  let mockCheckInRepository: jest.Mocked<CheckInRepository>
  let mockUserRepository: jest.Mocked<UserRepository>

  let adminUser: User
  let normalUser: User
  let reservation: Reservation

  beforeEach(() => {
    // Mock 레포지토리 초기화
    mockReservationRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findByUserId: jest.fn(),
      findByDeviceId: jest.fn(),
      findByDateRange: jest.fn(),
      checkAvailability: jest.fn(),
      delete: jest.fn()
    }

    mockCheckInRepository = {
      findById: jest.fn(),
      findByReservationId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findActiveByDeviceId: jest.fn(),
      findByDateRange: jest.fn(),
      delete: jest.fn()
    }

    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findByGoogleId: jest.fn(),
      findByRole: jest.fn(),
      findByStatus: jest.fn(),
      countByRole: jest.fn(),
      countByStatus: jest.fn(),
      existsByEmail: jest.fn()
    }

    // 유스케이스 생성
    useCase = new HandleNoShowUseCase(
      mockReservationRepository,
      mockCheckInRepository,
      mockUserRepository
    )

    // 테스트 데이터 생성
    adminUser = User.create({
      id: 'admin-1',
      email: 'admin@test.com',
      fullName: '관리자',
      role: 'admin',
      status: 'active'
    })

    normalUser = User.create({
      id: 'user-1',
      email: 'user@test.com',
      fullName: '일반사용자',
      role: 'user',
      status: 'active'
    })
  })

  describe('정상적인 노쇼 처리', () => {
    it('예약 시작 시간 30분 후에 노쇼 처리할 수 있다', async () => {
      // Given
      // 현재 시간을 기준으로 1시간 전 예약 생성
      const now = KSTDateTime.now()
      const oneHourAgo = now.addHours(-1)
      const twoHoursAgo = now.addHours(-2)
      
      // 유효한 시간 범위로 조정 (예: 14시-15시)
      const startHour = 14
      const endHour = 15
      
      reservation = Reservation.create({
        id: 'reservation-1',
        userId: normalUser.id,
        deviceId: 'device-1',
        date: twoHoursAgo,
        timeSlot: TimeSlot.create(startHour, endHour),
        assignedDeviceNumber: 'PC-01'
      }).approve()

      mockUserRepository.findById.mockResolvedValue(adminUser)
      mockReservationRepository.findById.mockResolvedValue(reservation)
      mockCheckInRepository.findByReservationId.mockResolvedValue(null)
      mockReservationRepository.update.mockImplementation(r => Promise.resolve(r))

      // When
      const result = await useCase.execute({
        reservationId: reservation.id,
        adminId: adminUser.id,
        reason: '연락 없음'
      })

      // Then
      expect(result.reservation).toBeDefined()
      expect(result.reservation.status.value).toBe('no_show')

      // 예약 상태가 no_show로 변경되었는지 확인
      const updatedReservation = mockReservationRepository.update.mock.calls[0][0]
      expect(updatedReservation?.status.value).toBe('no_show')
    })
  })

  describe('노쇼 처리 실패 케이스', () => {
    beforeEach(() => {
      // 미래 예약 생성 (현재 시간 기준 1시간 후)
      const now = KSTDateTime.now()
      const oneHourLater = now.addHours(1)
      
      reservation = Reservation.create({
        id: 'reservation-1',
        userId: normalUser.id,
        deviceId: 'device-1',
        date: oneHourLater,
        timeSlot: TimeSlot.create(16, 18), // 16시-18시로 고정
        assignedDeviceNumber: 'PC-01'
      }).approve()
    })

    it('관리자가 아닌 사용자는 노쇼 처리할 수 없다', async () => {
      // Given
      mockUserRepository.findById.mockResolvedValue(normalUser)

      // When & Then
      await expect(useCase.execute({
        reservationId: reservation.id,
        adminId: normalUser.id
      })).rejects.toThrow('관리자 권한이 없습니다')
    })

    it('존재하지 않는 예약은 노쇼 처리할 수 없다', async () => {
      // Given
      mockUserRepository.findById.mockResolvedValue(adminUser)
      mockReservationRepository.findById.mockResolvedValue(null)

      // When & Then
      await expect(useCase.execute({
        reservationId: 'non-existent',
        adminId: adminUser.id
      })).rejects.toThrow('예약을 찾을 수 없습니다')
    })

    it('승인되지 않은 예약은 노쇼 처리할 수 없다', async () => {
      // Given
      const pendingReservation = Reservation.create({
        id: 'reservation-2',
        userId: normalUser.id,
        deviceId: 'device-1',
        date: KSTDateTime.now(),
        timeSlot: TimeSlot.create(14, 16),
        assignedDeviceNumber: 'PC-01'
      })

      mockUserRepository.findById.mockResolvedValue(adminUser)
      mockReservationRepository.findById.mockResolvedValue(pendingReservation)

      // When & Then
      await expect(useCase.execute({
        reservationId: pendingReservation.id,
        adminId: adminUser.id
      })).rejects.toThrow('승인된 예약만 노쇼 처리할 수 있습니다')
    })

    it('이미 체크인된 예약은 노쇼 처리할 수 없다', async () => {
      // Given
      const checkIn = CheckIn.create({
        reservationId: reservation.id,
        deviceId: 'device-1',
        paymentAmount: 30000,
        reservationStartTime: new Date()
      })

      mockUserRepository.findById.mockResolvedValue(adminUser)
      mockReservationRepository.findById.mockResolvedValue(reservation)
      mockCheckInRepository.findByReservationId.mockResolvedValue(checkIn)

      // When & Then
      await expect(useCase.execute({
        reservationId: reservation.id,
        adminId: adminUser.id
      })).rejects.toThrow('이미 체크인된 예약은 노쇼 처리할 수 없습니다')
    })

    it('예약 시작 시간 30분 전에는 노쇼 처리할 수 없다', async () => {
      // Given
      mockUserRepository.findById.mockResolvedValue(adminUser)
      mockReservationRepository.findById.mockResolvedValue(reservation)
      mockCheckInRepository.findByReservationId.mockResolvedValue(null)

      // When & Then
      await expect(useCase.execute({
        reservationId: reservation.id,
        adminId: adminUser.id
      })).rejects.toThrow('예약 시작 시간 30분 후부터 노쇼 처리가 가능합니다')
    })
  })

  describe('자동 노쇼 처리', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('예약 시작 시간으로부터 1시간이 지난 예약을 자동으로 노쇼 처리한다', async () => {
      // Given - 현재 시간을 2025년 7월 10일 16시 30분으로 고정
      const mockNow = new Date(2025, 6, 10, 16, 30, 0)  // 2025-07-10 16:30
      const mockKSTNow = KSTDateTime.create(mockNow)
      
      jest.spyOn(Date, 'now').mockReturnValue(mockNow.getTime())
      jest.spyOn(KSTDateTime, 'now').mockReturnValue(mockKSTNow)
      
      const today = KSTDateTime.fromString('2025-07-10 00:00:00')
      
      // 1번 예약: 오늘 10시-12시 예약 (현재 16시이므로 4시간 전 시작 -> 노쇼 대상)
      const oldReservation1 = Reservation.create({
        id: 'old-1',
        userId: 'user-1',
        deviceId: 'device-1',
        date: today,
        timeSlot: TimeSlot.create(10, 12),
        assignedDeviceNumber: 'PC-01'
      }).approve()

      // 2번 예약: 오늘 14시-16시 예약 (현재 16시이므로 2시간 전 시작 -> 노쇼 대상)
      const oldReservation2 = Reservation.create({
        id: 'old-2',
        userId: 'user-2',
        deviceId: 'device-2',
        date: today,
        timeSlot: TimeSlot.create(14, 16),
        assignedDeviceNumber: 'PC-02'
      }).approve()

      // 3번 예약: 최근 예약 - 16시에 시작한 예약 (현재 16시 30분이므로 30분만 지남 -> 아직 노쇼 아님)
      const recentReservation = Reservation.create({
        id: 'recent-1',
        userId: 'user-3',
        deviceId: 'device-3',
        date: today,
        timeSlot: TimeSlot.create(16, 18),
        assignedDeviceNumber: 'PC-03'
      }).approve()

      // 4번 예약: 이미 체크인된 예약
      const checkedInReservation = Reservation.create({
        id: 'checked-1',
        userId: 'user-4',
        deviceId: 'device-4',
        date: today,
        timeSlot: TimeSlot.create(12, 14),
        assignedDeviceNumber: 'PC-04'
      }).approve()

      // 예약 목록 설정 - 날짜 범위 내에 있는 모든 예약 반환
      const allReservations = [
        oldReservation1,
        oldReservation2,
        recentReservation,
        checkedInReservation
      ]
      
      // findByDateRange는 현재 시간 기준으로 최근 1시간 이내의 예약을 조회
      // 그러나 모든 테스트 예약이 이 범위에 포함되도록 설정
      mockReservationRepository.findByDateRange.mockResolvedValue(allReservations)
      
      // 각 예약에 대한 update 메서드 설정
      mockReservationRepository.update.mockImplementation(r => Promise.resolve(r))
      
      // 체크인된 예약에 대한 체크인 기록 추가
      const checkIn = CheckIn.create({
        reservationId: checkedInReservation.id,
        deviceId: checkedInReservation.deviceId,
        paymentAmount: 30000,
        reservationStartTime: new Date(2025, 6, 10, 12, 0, 0)  // 12시 시작
      })
      
      // 각 예약에 대한 체크인 상태 설정
      mockCheckInRepository.findByReservationId
        .mockResolvedValueOnce(null) // old-1
        .mockResolvedValueOnce(null) // old-2
        .mockResolvedValueOnce(null) // recent-1
        .mockResolvedValueOnce(checkIn) // checked-1

      // When
      const results = await useCase.processAutoNoShow()

      // Then
      expect(results).toHaveLength(2) // 2개만 노쇼 처리됨
      expect(results.some(r => r.reservation.id === 'old-1')).toBe(true)
      expect(results.some(r => r.reservation.id === 'old-2')).toBe(true)
      expect(results.some(r => r.reservation.id === 'recent-1')).toBe(false)
      expect(results.some(r => r.reservation.id === 'checked-1')).toBe(false)

      // 노쇼 처리된 예약 상태 확인
      const noShowResults = results.filter(r => r.reservation.status.value === 'no_show')
      expect(noShowResults).toHaveLength(2)
      
      // update가 올바른 예약들에 대해서만 호출되었는지 확인
      expect(mockReservationRepository.update).toHaveBeenCalledTimes(2)
      
      // 노쇼 처리된 예약들의 상태 확인
      const updatedReservations = mockReservationRepository.update.mock.calls.map(call => call[0])
      expect(updatedReservations.every(r => r.status.value === 'no_show')).toBe(true)
    })
  })
})