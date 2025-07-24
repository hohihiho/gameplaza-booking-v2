import { ProcessCheckInUseCase } from '../process-check-in.use-case'
import { InMemoryReservationRepository } from '@/src/infrastructure/repositories/in-memory/reservation.repository'
import { InMemoryCheckInRepository } from '@/src/infrastructure/repositories/in-memory/check-in.repository'
import { InMemoryDeviceRepository } from '@/src/infrastructure/repositories/in-memory/device.repository'
import { InMemoryUserRepository } from '@/src/infrastructure/repositories/in-memory/user.repository'
import { Reservation } from '@/src/domain/entities/reservation'
import { Device } from '@/src/domain/entities/device.entity'
import { User } from '@/src/domain/entities/user.entity'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'
import { TimeSlot } from '@/src/domain/value-objects/time-slot'
import { CheckIn } from '@/src/domain/entities/check-in.entity'
import { v4 as uuidv4 } from 'uuid'

describe('ProcessCheckInUseCase', () => {
  let useCase: ProcessCheckInUseCase
  let reservationRepository: InMemoryReservationRepository
  let checkInRepository: InMemoryCheckInRepository
  let deviceRepository: InMemoryDeviceRepository
  let userRepository: InMemoryUserRepository

  let adminUser: User
  let normalUser: User
  let device: Device
  let reservation: Reservation

  beforeEach(() => {
    // 레포지토리 초기화
    reservationRepository = new InMemoryReservationRepository()
    checkInRepository = new InMemoryCheckInRepository()
    deviceRepository = new InMemoryDeviceRepository()
    userRepository = new InMemoryUserRepository()

    // 유스케이스 생성
    useCase = new ProcessCheckInUseCase(
      reservationRepository,
      checkInRepository,
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
      status: 'active'
    })

    // 현재 시간 기준으로 1시간 후 예약 생성
    const now = KSTDateTime.now()
    const reservationDate = now.addHours(1)
    const currentHour = reservationDate.date.getHours()
    
    reservation = Reservation.create({
      id: 'reservation-1',
      userId: normalUser.id,
      deviceId: device.id,
      date: reservationDate,
      timeSlot: TimeSlot.create(currentHour, currentHour + 2)
    })

    // 예약을 승인 상태로 변경
    reservation = reservation.approve()
  })

  describe('정상적인 체크인 처리', () => {
    it('예약 시간 30분 전에 체크인할 수 있다', async () => {
      // Given
      await userRepository.save(adminUser)
      await userRepository.save(normalUser)
      await deviceRepository.save(device)
      await reservationRepository.save(reservation)

      // 현재 시간을 예약 시작 20분 전으로 설정
      jest.useFakeTimers()
      const checkInTime = new Date(reservation.startDateTime.toDate().getTime() - 20 * 60 * 1000)
      jest.setSystemTime(checkInTime)

      // When
      const result = await useCase.execute({
        reservationId: reservation.id,
        adminId: adminUser.id,
        notes: '정상 체크인'
      })

      // Then
      expect(result.checkIn).toBeDefined()
      expect(result.checkIn.reservationId).toBe(reservation.id)
      expect(result.checkIn.userId).toBe(normalUser.id)
      expect(result.checkIn.deviceId).toBe(device.id)
      expect(result.checkIn.status).toBe('checked_in')
      expect(result.checkIn.checkInBy).toBe(adminUser.id)
      expect(result.checkIn.notes).toBe('정상 체크인')

      // 예약 상태가 checked_in으로 변경되었는지 확인
      const updatedReservation = await reservationRepository.findById(reservation.id)
      expect(updatedReservation?.status.value).toBe('checked_in')

      // 기기 상태가 in_use로 변경되었는지 확인
      const updatedDevice = await deviceRepository.findById(device.id)
      expect(updatedDevice?.status).toBe('in_use')

      jest.useRealTimers()
    })

    it('예약 시간 정각에 체크인할 수 있다', async () => {
      // Given
      await userRepository.save(adminUser)
      await userRepository.save(normalUser)
      await deviceRepository.save(device)
      await reservationRepository.save(reservation)

      // 현재 시간을 예약 시작 시간으로 설정
      jest.useFakeTimers()
      jest.setSystemTime(reservation.startDateTime.toDate())

      // When
      const result = await useCase.execute({
        reservationId: reservation.id,
        adminId: adminUser.id
      })

      // Then
      expect(result.checkIn).toBeDefined()
      expect(result.checkIn.status).toBe('checked_in')

      jest.useRealTimers()
    })
  })

  describe('체크인 실패 케이스', () => {
    it('관리자가 아닌 사용자는 체크인을 처리할 수 없다', async () => {
      // Given
      await userRepository.save(normalUser)
      await reservationRepository.save(reservation)

      // When & Then
      await expect(useCase.execute({
        reservationId: reservation.id,
        adminId: normalUser.id
      })).rejects.toThrow('관리자 권한이 없습니다')
    })

    it('존재하지 않는 예약은 체크인할 수 없다', async () => {
      // Given
      await userRepository.save(adminUser)

      // When & Then
      await expect(useCase.execute({
        reservationId: 'non-existent',
        adminId: adminUser.id
      })).rejects.toThrow('예약을 찾을 수 없습니다')
    })

    it('승인되지 않은 예약은 체크인할 수 없다', async () => {
      // Given
      const pendingReservation = Reservation.create({
        id: 'reservation-2',
        userId: normalUser.id,
        deviceId: device.id,
        date: KSTDateTime.now().addHours(1),
        timeSlot: TimeSlot.create(14, 16)
      })

      await userRepository.save(adminUser)
      await reservationRepository.save(pendingReservation)

      // When & Then
      await expect(useCase.execute({
        reservationId: pendingReservation.id,
        adminId: adminUser.id
      })).rejects.toThrow('승인된 예약만 체크인할 수 있습니다')
    })

    it('이미 체크인된 예약은 다시 체크인할 수 없다', async () => {
      // Given
      await userRepository.save(adminUser)
      await userRepository.save(normalUser)
      await deviceRepository.save(device)
      await reservationRepository.save(reservation)

      const existingCheckIn = CheckIn.create({
        reservationId: reservation.id,
        userId: normalUser.id,
        deviceId: device.id,
        checkInTime: KSTDateTime.now(),
        status: 'checked_in',
        checkInBy: adminUser.id
      })
      await checkInRepository.save(existingCheckIn)

      // When & Then
      await expect(useCase.execute({
        reservationId: reservation.id,
        adminId: adminUser.id
      })).rejects.toThrow('이미 체크인이 완료된 예약입니다')
    })

    it('예약 시간 30분 전보다 일찍 체크인할 수 없다', async () => {
      // Given
      await userRepository.save(adminUser)
      await userRepository.save(normalUser)
      await deviceRepository.save(device)
      await reservationRepository.save(reservation)

      // 현재 시간을 예약 시작 40분 전으로 설정
      jest.useFakeTimers()
      const earlyCheckInTime = new Date(reservation.startDateTime.toDate().getTime() - 40 * 60 * 1000)
      jest.setSystemTime(earlyCheckInTime)

      // When & Then
      await expect(useCase.execute({
        reservationId: reservation.id,
        adminId: adminUser.id
      })).rejects.toThrow('예약 시간 30분 전부터 체크인이 가능합니다')

      jest.useRealTimers()
    })

    it('예약 종료 시간 이후에는 체크인할 수 없다', async () => {
      // Given
      await userRepository.save(adminUser)
      await userRepository.save(normalUser)
      await deviceRepository.save(device)
      await reservationRepository.save(reservation)

      // 현재 시간을 예약 종료 시간 이후로 설정
      jest.useFakeTimers()
      const lateCheckInTime = new Date(reservation.endDateTime.toDate().getTime() + 10 * 60 * 1000)
      jest.setSystemTime(lateCheckInTime)

      // When & Then
      await expect(useCase.execute({
        reservationId: reservation.id,
        adminId: adminUser.id
      })).rejects.toThrow('예약 시간이 지나 체크인할 수 없습니다')

      jest.useRealTimers()
    })

    it('비활성 기기는 체크인할 수 없다', async () => {
      // Given
      const inactiveDevice = Device.create({
        id: 'device-2',
        deviceNumber: 'PC-02',
        name: 'Gaming PC 2',
        type: 'desktop',
        status: 'inactive'
      })

      const reservationWithInactiveDevice = Reservation.create({
        id: 'reservation-3',
        userId: normalUser.id,
        deviceId: inactiveDevice.id,
        date: KSTDateTime.now().addHours(1),
        timeSlot: TimeSlot.create(14, 16)
      }).approve()

      await userRepository.save(adminUser)
      await userRepository.save(normalUser)
      await deviceRepository.save(inactiveDevice)
      await reservationRepository.save(reservationWithInactiveDevice)

      // When & Then
      await expect(useCase.execute({
        reservationId: reservationWithInactiveDevice.id,
        adminId: adminUser.id
      })).rejects.toThrow('사용할 수 없는 기기입니다')
    })

    it('이미 사용 중인 기기는 체크인할 수 없다', async () => {
      // Given
      await userRepository.save(adminUser)
      await userRepository.save(normalUser)
      await deviceRepository.save(device)
      await reservationRepository.save(reservation)

      // 다른 체크인이 이미 존재
      const anotherCheckIn = CheckIn.create({
        id: 'checkin-2',
        reservationId: 'another-reservation',
        userId: 'another-user',
        deviceId: device.id,
        checkInTime: KSTDateTime.now(),
        status: 'checked_in',
        checkInBy: adminUser.id
      })
      await checkInRepository.save(anotherCheckIn)

      // When & Then
      await expect(useCase.execute({
        reservationId: reservation.id,
        adminId: adminUser.id
      })).rejects.toThrow('해당 기기는 이미 사용 중입니다')
    })
  })
})