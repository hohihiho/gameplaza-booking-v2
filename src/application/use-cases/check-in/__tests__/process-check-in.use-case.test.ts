import { ProcessCheckInUseCase } from '../process-check-in.use-case'
import { ReservationRepository } from '@/src/domain/repositories/reservation-repository.interface'
import { CheckInRepository } from '@/src/domain/repositories/check-in-repository.interface'
import { DeviceRepository } from '@/src/domain/repositories/device-repository.interface'
import { UserRepository } from '@/src/domain/repositories/user-repository.interface'
import { Reservation } from '@/src/domain/entities/reservation'
import { Device } from '@/src/domain/entities/device'
import { User } from '@/src/domain/entities/user'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'
import { TimeSlot } from '@/src/domain/value-objects/time-slot'
import { CheckIn } from '@/src/domain/entities/checkin'

describe('ProcessCheckInUseCase', () => {
  let useCase: ProcessCheckInUseCase
  let mockReservationRepository: jest.Mocked<ReservationRepository>
  let mockCheckInRepository: jest.Mocked<CheckInRepository>
  let mockDeviceRepository: jest.Mocked<DeviceRepository>
  let mockUserRepository: jest.Mocked<UserRepository>

  let adminUser: User
  let normalUser: User
  let device: Device
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

    mockDeviceRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByType: jest.fn(),
      findByStatus: jest.fn()
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
    useCase = new ProcessCheckInUseCase(
      mockReservationRepository,
      mockCheckInRepository,
      mockDeviceRepository,
      mockUserRepository
    )

    // 테스트 데이터 생성
    adminUser = User.create({
      id: 'admin-1',
      email: 'admin@test.com',
      fullName: '관리자',
      role: 'admin',
      status: 'active',
      birthDate: new Date('1990-01-01')
    })

    normalUser = User.create({
      id: 'user-1',
      email: 'user@test.com',
      fullName: '일반사용자',
      role: 'user',
      status: 'active',
      birthDate: new Date('1990-01-01')
    })

    device = Device.create({
      id: 'device-1',
      deviceTypeId: 'type-1',
      deviceNumber: 'PC-01'
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
      timeSlot: TimeSlot.create(currentHour, currentHour + 2),
      assignedDeviceNumber: device.deviceNumber
    })

    // 예약을 승인 상태로 변경
    reservation = reservation.approve()
  })

  describe('정상적인 체크인 처리', () => {
    it('예약 시간 30분 전에 체크인할 수 있다', async () => {
      // Given
      mockUserRepository.findById.mockResolvedValueOnce(adminUser)
      mockUserRepository.findById.mockResolvedValueOnce(normalUser)
      mockDeviceRepository.findById.mockResolvedValue(device)
      mockReservationRepository.findById.mockResolvedValue(reservation)
      mockCheckInRepository.findByReservationId.mockResolvedValue(null)
      mockCheckInRepository.save.mockImplementation(checkIn => Promise.resolve(checkIn))
      mockReservationRepository.update.mockImplementation(res => Promise.resolve(res))

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
      expect(result.checkIn.deviceId).toBe(device.id)
      expect(result.checkIn.status.value).toBe('checked_in')
      expect(result.checkIn.paymentStatus.value).toBe('pending')

      // 예약 상태가 checked_in으로 변경되었는지 확인
      const updatedReservation = mockReservationRepository.update.mock.calls[0][0]
      expect(updatedReservation?.status.value).toBe('checked_in')

      // 기기 상태가 in_use로 변경되었는지 확인
      const updatedDevice = mockDeviceRepository.update.mock.calls[0]?.[0]
      expect(updatedDevice?.status.value).toBe('in_use')

      jest.useRealTimers()
    })

    it('예약 시간 정각에 체크인할 수 있다', async () => {
      // Given
      mockUserRepository.findById.mockResolvedValue(adminUser)
      mockReservationRepository.findById.mockResolvedValue(reservation)
      mockDeviceRepository.findById.mockResolvedValue(device)
      mockCheckInRepository.findByReservationId.mockResolvedValue(null)
      mockCheckInRepository.findActiveByDeviceId.mockResolvedValue(null)
      mockCheckInRepository.save.mockImplementation(checkIn => Promise.resolve(checkIn))
      mockReservationRepository.update.mockImplementation(res => Promise.resolve(res))
      mockDeviceRepository.update.mockImplementation(dev => Promise.resolve(dev))

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
      expect(result.checkIn.reservationId).toBe(reservation.id)
      expect(result.checkIn.deviceId).toBe(device.id)
      expect(result.checkIn.status.value).toBe('checked_in')

      jest.useRealTimers()
    })
  })

  describe('체크인 실패 케이스', () => {
    it('관리자가 아닌 사용자는 체크인을 처리할 수 없다', async () => {
      // Given
      mockUserRepository.findById.mockResolvedValue(normalUser)

      // When & Then
      await expect(useCase.execute({
        reservationId: reservation.id,
        adminId: normalUser.id
      })).rejects.toThrow('관리자 권한이 없습니다')
    })

    it('존재하지 않는 예약은 체크인할 수 없다', async () => {
      // Given
      mockUserRepository.findById.mockResolvedValue(adminUser)
      mockReservationRepository.findById.mockResolvedValue(null)

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

      mockUserRepository.findById.mockResolvedValue(adminUser)
      mockReservationRepository.findById.mockResolvedValue(pendingReservation)

      // When & Then
      await expect(useCase.execute({
        reservationId: pendingReservation.id,
        adminId: adminUser.id
      })).rejects.toThrow('승인된 예약만 체크인할 수 있습니다')
    })

    it('이미 체크인된 예약은 다시 체크인할 수 없다', async () => {
      // Given
      const now = new Date()
      const futureTime = new Date(now.getTime() + 30 * 60 * 1000) // 30분 후
      
      const existingCheckIn = CheckIn.create({
        reservationId: reservation.id,
        deviceId: device.id,
        paymentAmount: 30000,
        reservationStartTime: futureTime
      })

      mockUserRepository.findById.mockResolvedValue(adminUser)
      mockReservationRepository.findById.mockResolvedValue(reservation)
      mockCheckInRepository.findByReservationId.mockResolvedValue(existingCheckIn)

      // When & Then
      await expect(useCase.execute({
        reservationId: reservation.id,
        adminId: adminUser.id
      })).rejects.toThrow('이미 체크인이 완료된 예약입니다')
    })

    it('예약 시간 30분 전보다 일찍 체크인할 수 없다', async () => {
      // Given
      mockUserRepository.findById.mockResolvedValue(adminUser)
      mockReservationRepository.findById.mockResolvedValue(reservation)
      mockDeviceRepository.findById.mockResolvedValue(device)
      mockCheckInRepository.findByReservationId.mockResolvedValue(null)

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
      mockUserRepository.findById.mockResolvedValue(adminUser)
      mockReservationRepository.findById.mockResolvedValue(reservation)
      mockDeviceRepository.findById.mockResolvedValue(device)
      mockCheckInRepository.findByReservationId.mockResolvedValue(null)

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
        deviceTypeId: 'type-1',
        deviceNumber: 'PC-02'
      }).changeStatus('maintenance')

      // 현재 시간으로부터 1시간 후로 예약 생성
      const now = new Date()
      const futureTime = new Date(now.getTime() + 60 * 60 * 1000) // 1시간 후
      const hour = futureTime.getHours()
      
      const reservationWithInactiveDevice = Reservation.create({
        id: 'reservation-3',
        userId: normalUser.id,
        deviceId: inactiveDevice.id,
        date: KSTDateTime.create(futureTime),
        timeSlot: TimeSlot.create(hour, hour + 2),
        assignedDeviceNumber: inactiveDevice.deviceNumber
      }).approve()

      mockUserRepository.findById.mockResolvedValue(adminUser)
      mockReservationRepository.findById.mockResolvedValue(reservationWithInactiveDevice)
      mockDeviceRepository.findById.mockResolvedValue(inactiveDevice)
      mockCheckInRepository.findByReservationId.mockResolvedValue(null)

      // When & Then
      await expect(useCase.execute({
        reservationId: reservationWithInactiveDevice.id,
        adminId: adminUser.id
      })).rejects.toThrow('사용할 수 없는 기기입니다')
    })

    it('이미 사용 중인 기기는 체크인할 수 없다', async () => {
      // Given
      const now = KSTDateTime.now()
      const futureTime = now.addMinutes(25) // 25분 후 (30분 전부터 체크인 가능)
      const hour = futureTime.date.getHours()
      
      // 체크인 가능한 시간대의 예약 생성
      const nearReservation = Reservation.create({
        id: 'reservation-near',
        userId: normalUser.id,
        deviceId: device.id,
        date: futureTime,
        timeSlot: TimeSlot.create(hour, hour + 2),
        assignedDeviceNumber: device.deviceNumber
      }).approve()
      
      // 다른 체크인이 이미 존재
      const anotherCheckIn = CheckIn.create({
        reservationId: 'another-reservation',
        deviceId: device.id,
        paymentAmount: 30000,
        reservationStartTime: futureTime.toDate()
      })

      mockUserRepository.findById.mockResolvedValue(adminUser)
      mockReservationRepository.findById.mockResolvedValue(nearReservation)
      mockDeviceRepository.findById.mockResolvedValue(device)
      mockCheckInRepository.findByReservationId.mockResolvedValue(null)
      mockCheckInRepository.findActiveByDeviceId.mockResolvedValue(anotherCheckIn)

      // When & Then
      await expect(useCase.execute({
        reservationId: nearReservation.id,
        adminId: adminUser.id
      })).rejects.toThrow('해당 기기는 이미 사용 중입니다')
    })
  })
})