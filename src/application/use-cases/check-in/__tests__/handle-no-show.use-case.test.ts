import { HandleNoShowUseCase } from '../handle-no-show.use-case'
import { InMemoryReservationRepository } from '@/src/infrastructure/repositories/in-memory/reservation.repository'
import { InMemoryCheckInRepository } from '@/src/infrastructure/repositories/in-memory/check-in.repository'
import { InMemoryUserRepository } from '@/src/infrastructure/repositories/in-memory/user.repository'
import { Reservation } from '@/src/domain/entities/reservation'
import { CheckIn } from '@/src/domain/entities/check-in.entity'
import { User } from '@/src/domain/entities/user.entity'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'
import { TimeSlot } from '@/src/domain/value-objects/time-slot'

describe('HandleNoShowUseCase', () => {
  let useCase: HandleNoShowUseCase
  let reservationRepository: InMemoryReservationRepository
  let checkInRepository: InMemoryCheckInRepository
  let userRepository: InMemoryUserRepository

  let adminUser: User
  let normalUser: User
  let reservation: Reservation

  beforeEach(() => {
    // 레포지토리 초기화
    reservationRepository = new InMemoryReservationRepository()
    checkInRepository = new InMemoryCheckInRepository()
    userRepository = new InMemoryUserRepository()

    // 유스케이스 생성
    useCase = new HandleNoShowUseCase(
      reservationRepository,
      checkInRepository,
      userRepository
    )

    // 테스트 데이터 생성
    adminUser = User.create({
      id: 'admin-1',
      email: 'admin@test.com',
      name: '관리자',
      role: 'admin',
      status: 'active'
    })

    normalUser = User.create({
      id: 'user-1',
      email: 'user@test.com',
      name: '일반사용자',
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
      
      reservation = Reservation.create({
        id: 'reservation-1',
        userId: normalUser.id,
        deviceId: 'device-1',
        date: twoHoursAgo,
        timeSlot: TimeSlot.create(twoHoursAgo.date.getHours(), oneHourAgo.date.getHours())
      }).approve()

      await userRepository.save(adminUser)
      await userRepository.save(normalUser)
      await reservationRepository.save(reservation)

      // When
      const result = await useCase.execute({
        reservationId: reservation.id,
        adminId: adminUser.id,
        reason: '연락 없음'
      })

      // Then
      expect(result.reservationId).toBe(reservation.id)
      expect(result.status).toBe('no_show')

      // 예약 상태가 no_show로 변경되었는지 확인
      const updatedReservation = await reservationRepository.findById(reservation.id)
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
        timeSlot: TimeSlot.create(oneHourLater.date.getHours(), oneHourLater.date.getHours() + 2)
      }).approve()
    })

    it('관리자가 아닌 사용자는 노쇼 처리할 수 없다', async () => {
      // Given
      await userRepository.save(normalUser)
      await reservationRepository.save(reservation)

      // When & Then
      await expect(useCase.execute({
        reservationId: reservation.id,
        adminId: normalUser.id
      })).rejects.toThrow('관리자 권한이 없습니다')
    })

    it('존재하지 않는 예약은 노쇼 처리할 수 없다', async () => {
      // Given
      await userRepository.save(adminUser)

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
        timeSlot: TimeSlot.create(14, 16)
      })

      await userRepository.save(adminUser)
      await reservationRepository.save(pendingReservation)

      // When & Then
      await expect(useCase.execute({
        reservationId: pendingReservation.id,
        adminId: adminUser.id
      })).rejects.toThrow('승인된 예약만 노쇼 처리할 수 있습니다')
    })

    it('이미 체크인된 예약은 노쇼 처리할 수 없다', async () => {
      // Given
      await userRepository.save(adminUser)
      await reservationRepository.save(reservation)

      const checkIn = CheckIn.create({
        reservationId: reservation.id,
        userId: normalUser.id,
        deviceId: 'device-1',
        checkInTime: KSTDateTime.now(),
        status: 'checked_in',
        checkInBy: adminUser.id
      })
      await checkInRepository.save(checkIn)

      // When & Then
      await expect(useCase.execute({
        reservationId: reservation.id,
        adminId: adminUser.id
      })).rejects.toThrow('이미 체크인된 예약은 노쇼 처리할 수 없습니다')
    })

    it('예약 시작 시간 30분 전에는 노쇼 처리할 수 없다', async () => {
      // Given
      await userRepository.save(adminUser)
      await reservationRepository.save(reservation)

      // When & Then
      await expect(useCase.execute({
        reservationId: reservation.id,
        adminId: adminUser.id
      })).rejects.toThrow('예약 시작 시간 30분 후부터 노쇼 처리가 가능합니다')
    })
  })

  describe('자동 노쇼 처리', () => {
    it('예약 시작 시간으로부터 1시간이 지난 예약을 자동으로 노쇼 처리한다', async () => {
      // Given
      const now = KSTDateTime.now()
      
      // 2시간 전 예약 (1시간 이상 지남)
      const oldReservation1 = Reservation.create({
        id: 'old-1',
        userId: 'user-1',
        deviceId: 'device-1',
        date: now.addHours(-3),
        timeSlot: TimeSlot.create(10, 12)
      }).approve()

      // 1.5시간 전 예약 (1시간 이상 지남)
      const oldReservation2 = Reservation.create({
        id: 'old-2',
        userId: 'user-2',
        deviceId: 'device-2',
        date: now.addHours(-2),
        timeSlot: TimeSlot.create(11, 13)
      }).approve()

      // 30분 전 예약 (아직 1시간 안 지남)
      const recentReservation = Reservation.create({
        id: 'recent-1',
        userId: 'user-3',
        deviceId: 'device-3',
        date: now.addHours(-0.5),
        timeSlot: TimeSlot.create(13, 15)
      }).approve()

      // 이미 체크인된 예약
      const checkedInReservation = Reservation.create({
        id: 'checked-1',
        userId: 'user-4',
        deviceId: 'device-4',
        date: now.addHours(-2),
        timeSlot: TimeSlot.create(10, 12)
      }).approve()

      await reservationRepository.save(oldReservation1)
      await reservationRepository.save(oldReservation2)
      await reservationRepository.save(recentReservation)
      await reservationRepository.save(checkedInReservation)

      // 체크인된 예약에 대한 체크인 기록 추가
      const checkIn = CheckIn.create({
        reservationId: checkedInReservation.id,
        userId: checkedInReservation.userId,
        deviceId: checkedInReservation.deviceId,
        checkInTime: now.addHours(-2),
        status: 'checked_in',
        checkInBy: 'admin-1'
      })
      await checkInRepository.save(checkIn)

      // When
      const results = await useCase.processAutoNoShow()

      // Then
      expect(results).toHaveLength(2) // 2개만 노쇼 처리됨
      expect(results.some(r => r.reservationId === 'old-1')).toBe(true)
      expect(results.some(r => r.reservationId === 'old-2')).toBe(true)
      expect(results.some(r => r.reservationId === 'recent-1')).toBe(false)
      expect(results.some(r => r.reservationId === 'checked-1')).toBe(false)

      // 상태 확인
      const updatedOld1 = await reservationRepository.findById('old-1')
      const updatedOld2 = await reservationRepository.findById('old-2')
      const updatedRecent = await reservationRepository.findById('recent-1')
      const updatedCheckedIn = await reservationRepository.findById('checked-1')

      expect(updatedOld1?.status.value).toBe('no_show')
      expect(updatedOld2?.status.value).toBe('no_show')
      expect(updatedRecent?.status.value).toBe('approved')
      expect(updatedCheckedIn?.status.value).toBe('approved')
    })
  })
})