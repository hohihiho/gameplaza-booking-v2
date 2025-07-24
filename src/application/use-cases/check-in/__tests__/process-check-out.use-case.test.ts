import { ProcessCheckOutUseCase } from '../process-check-out.use-case'
import { InMemoryCheckInRepository } from '@/src/infrastructure/repositories/in-memory/check-in.repository'
import { InMemoryReservationRepository } from '@/src/infrastructure/repositories/in-memory/reservation.repository'
import { InMemoryDeviceRepository } from '@/src/infrastructure/repositories/in-memory/device.repository'
import { InMemoryUserRepository } from '@/src/infrastructure/repositories/in-memory/user.repository'
import { CheckIn } from '@/src/domain/entities/check-in.entity'
import { Reservation } from '@/src/domain/entities/reservation'
import { Device } from '@/src/domain/entities/device.entity'
import { User } from '@/src/domain/entities/user.entity'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'
import { TimeSlot } from '@/src/domain/value-objects/time-slot'

describe('ProcessCheckOutUseCase', () => {
  let useCase: ProcessCheckOutUseCase
  let checkInRepository: InMemoryCheckInRepository
  let reservationRepository: InMemoryReservationRepository
  let deviceRepository: InMemoryDeviceRepository
  let userRepository: InMemoryUserRepository

  let adminUser: User
  let normalUser: User
  let device: Device
  let reservation: Reservation
  let checkIn: CheckIn

  beforeEach(() => {
    // 레포지토리 초기화
    checkInRepository = new InMemoryCheckInRepository()
    reservationRepository = new InMemoryReservationRepository()
    deviceRepository = new InMemoryDeviceRepository()
    userRepository = new InMemoryUserRepository()

    // 유스케이스 생성
    useCase = new ProcessCheckOutUseCase(
      checkInRepository,
      reservationRepository,
      deviceRepository,
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

    device = Device.create({
      id: 'device-1',
      deviceNumber: 'PC-01',
      name: 'Gaming PC 1',
      type: 'desktop',
      status: 'in_use'
    })

    // 현재 시간으로 예약 생성
    const now = KSTDateTime.now()
    const currentHour = now.date.getHours()
    
    reservation = Reservation.create({
      id: 'reservation-1',
      userId: normalUser.id,
      deviceId: device.id,
      date: now,
      timeSlot: TimeSlot.create(currentHour, currentHour + 2)
    })

    // 예약을 체크인 상태로 변경
    reservation = reservation.approve().checkIn()

    // 체크인 생성 (30분 전)
    const checkInTime = now.addHours(-0.5)
    checkIn = CheckIn.create({
      id: 'checkin-1',
      reservationId: reservation.id,
      userId: normalUser.id,
      deviceId: device.id,
      checkInTime: checkInTime,
      status: 'checked_in',
      checkInBy: adminUser.id
    })
  })

  describe('정상적인 체크아웃 처리', () => {
    it('체크인된 사용자를 체크아웃할 수 있다', async () => {
      // Given
      await userRepository.save(adminUser)
      await userRepository.save(normalUser)
      await deviceRepository.save(device)
      await reservationRepository.save(reservation)
      await checkInRepository.save(checkIn)

      // When
      const result = await useCase.execute({
        checkInId: checkIn.id,
        adminId: adminUser.id,
        notes: '정상 체크아웃'
      })

      // Then
      expect(result.checkIn).toBeDefined()
      expect(result.checkIn.status).toBe('checked_out')
      expect(result.checkIn.checkOutBy).toBe(adminUser.id)
      expect(result.checkIn.checkOutTime).toBeDefined()
      expect(result.checkIn.notes).toBe('정상 체크아웃')
      expect(result.usageMinutes).toBeGreaterThan(0)

      // 예약 상태가 completed로 변경되었는지 확인
      const updatedReservation = await reservationRepository.findById(reservation.id)
      expect(updatedReservation?.status.value).toBe('completed')

      // 기기 상태가 active로 변경되었는지 확인
      const updatedDevice = await deviceRepository.findById(device.id)
      expect(updatedDevice?.status).toBe('active')
    })

    it('사용 시간을 정확히 계산한다', async () => {
      // Given
      await userRepository.save(adminUser)
      await userRepository.save(normalUser)
      await deviceRepository.save(device)
      await reservationRepository.save(reservation)
      
      // 체크인 시간을 2시간 전으로 설정
      const twoHoursAgo = KSTDateTime.now().addHours(-2)
      const longCheckIn = CheckIn.create({
        id: 'checkin-2',
        reservationId: reservation.id,
        userId: normalUser.id,
        deviceId: device.id,
        checkInTime: twoHoursAgo,
        status: 'checked_in',
        checkInBy: adminUser.id
      })
      await checkInRepository.save(longCheckIn)

      // When
      const result = await useCase.execute({
        checkInId: longCheckIn.id,
        adminId: adminUser.id
      })

      // Then
      expect(result.usageMinutes).toBe(120) // 2시간 = 120분
    })
  })

  describe('체크아웃 실패 케이스', () => {
    it('관리자가 아닌 사용자는 체크아웃을 처리할 수 없다', async () => {
      // Given
      await userRepository.save(normalUser)
      await checkInRepository.save(checkIn)

      // When & Then
      await expect(useCase.execute({
        checkInId: checkIn.id,
        adminId: normalUser.id
      })).rejects.toThrow('관리자 권한이 없습니다')
    })

    it('존재하지 않는 체크인은 체크아웃할 수 없다', async () => {
      // Given
      await userRepository.save(adminUser)

      // When & Then
      await expect(useCase.execute({
        checkInId: 'non-existent',
        adminId: adminUser.id
      })).rejects.toThrow('체크인 정보를 찾을 수 없습니다')
    })

    it('이미 체크아웃된 체크인은 다시 체크아웃할 수 없다', async () => {
      // Given
      const checkedOutCheckIn = checkIn.checkOut(adminUser.id, KSTDateTime.now())
      
      await userRepository.save(adminUser)
      await checkInRepository.save(checkedOutCheckIn)

      // When & Then
      await expect(useCase.execute({
        checkInId: checkedOutCheckIn.id,
        adminId: adminUser.id
      })).rejects.toThrow('체크인 상태가 아닙니다')
    })

    it('취소된 체크인은 체크아웃할 수 없다', async () => {
      // Given
      const cancelledCheckIn = checkIn.cancel(adminUser.id, '취소 사유')
      
      await userRepository.save(adminUser)
      await checkInRepository.save(cancelledCheckIn)

      // When & Then
      await expect(useCase.execute({
        checkInId: cancelledCheckIn.id,
        adminId: adminUser.id
      })).rejects.toThrow('체크인 상태가 아닙니다')
    })

    it('예약 정보가 없는 체크인은 체크아웃 시 에러가 발생한다', async () => {
      // Given
      await userRepository.save(adminUser)
      await checkInRepository.save(checkIn)
      // 예약 정보는 저장하지 않음

      // When & Then
      await expect(useCase.execute({
        checkInId: checkIn.id,
        adminId: adminUser.id
      })).rejects.toThrow('예약 정보를 찾을 수 없습니다')
    })
  })

  describe('기기 상태 처리', () => {
    it('기기 정보가 없어도 체크아웃은 완료된다', async () => {
      // Given
      await userRepository.save(adminUser)
      await userRepository.save(normalUser)
      await reservationRepository.save(reservation)
      await checkInRepository.save(checkIn)
      // 기기 정보는 저장하지 않음

      // When
      const result = await useCase.execute({
        checkInId: checkIn.id,
        adminId: adminUser.id
      })

      // Then
      expect(result.checkIn.status).toBe('checked_out')
      // 기기가 없어도 체크아웃은 정상 처리됨
    })
  })
})