import { ProcessCheckOutUseCase } from '../process-check-out.use-case'
import { CheckInRepository } from '@/src/domain/repositories/checkin-repository.interface'
import { ReservationRepository } from '@/src/domain/repositories/reservation-repository.interface'
import { DeviceRepository } from '@/src/domain/repositories/device-repository.interface'
import { UserRepository } from '@/src/domain/repositories/user-repository.interface'
import { CheckIn } from '@/src/domain/entities/checkin'
import { Reservation } from '@/src/domain/entities/reservation'
import { Device } from '@/src/domain/entities/device'
import { User } from '@/src/domain/entities/user'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'
import { TimeSlot } from '@/src/domain/value-objects/time-slot'

describe('ProcessCheckOutUseCase', () => {
  let useCase: ProcessCheckOutUseCase
  let mockCheckInRepository: jest.Mocked<CheckInRepository>
  let mockReservationRepository: jest.Mocked<ReservationRepository>
  let mockDeviceRepository: jest.Mocked<DeviceRepository>
  let mockUserRepository: jest.Mocked<UserRepository>

  let adminUser: User
  let normalUser: User
  let device: Device
  let reservation: Reservation
  let checkIn: CheckIn

  beforeEach(() => {
    // Mock 레포지토리 초기화
    mockCheckInRepository = {
      findById: jest.fn(),
      findByReservationId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findActiveByDeviceId: jest.fn(),
      findByDateRange: jest.fn(),
      delete: jest.fn()
    }

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
    useCase = new ProcessCheckOutUseCase(
      mockCheckInRepository,
      mockReservationRepository,
      mockDeviceRepository,
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

    device = Device.create({
      id: 'device-1',
      deviceTypeId: 'type-1',
      deviceNumber: 'PC-01'
    }).changeStatus('in_use')

    // 현재 시간으로 예약 생성
    const now = KSTDateTime.now()
    const currentHour = now.date.getHours()
    
    reservation = Reservation.create({
      id: 'reservation-1',
      userId: normalUser.id,
      deviceId: device.id,
      date: now,
      timeSlot: TimeSlot.create(currentHour, currentHour + 2),
      assignedDeviceNumber: device.deviceNumber
    })

    // 예약을 체크인 상태로 변경
    reservation = reservation.approve().checkIn()

    // 체크인 생성 (현재 시간)
    checkIn = CheckIn.create({
      reservationId: reservation.id,
      deviceId: device.id,
      paymentAmount: 30000,
      reservationStartTime: now.toDate()
    })
    
    // 결제 확인하여 IN_USE 상태로 변경
    checkIn = checkIn.confirmPayment('cash')
  })

  describe('정상적인 체크아웃 처리', () => {
    it('체크인된 사용자를 체크아웃할 수 있다', async () => {
      // Given
      mockUserRepository.findById.mockResolvedValue(adminUser)
      mockCheckInRepository.findById.mockResolvedValue(checkIn)
      mockReservationRepository.findById.mockResolvedValue(reservation)
      mockDeviceRepository.findById.mockResolvedValue(device)
      mockCheckInRepository.update.mockImplementation(c => Promise.resolve(c))
      mockReservationRepository.update.mockImplementation(r => Promise.resolve(r))
      mockDeviceRepository.update.mockImplementation(d => Promise.resolve(d))

      // When
      const result = await useCase.execute({
        checkInId: checkIn.id,
        adminId: adminUser.id,
        notes: '정상 체크아웃'
      })

      // Then
      expect(result.checkIn).toBeDefined()
      expect(result.checkIn.status.value).toBe('completed')
      expect(result.checkIn.checkOutTime).toBeDefined()
      
      // 예약 상태가 completed로 변경되었는지 확인
      const updatedReservation = mockReservationRepository.update.mock.calls[0][0]
      expect(updatedReservation?.status.value).toBe('completed')

      // 기기 상태가 available로 변경되었는지 확인
      const updatedDevice = mockDeviceRepository.update.mock.calls[0][0]
      expect(updatedDevice?.status.value).toBe('available')
    })

    it('사용 시간을 정확히 계산한다', async () => {
      // Given
      // 2시간 전에 체크인하고 실제 시작 시간도 2시간 전으로 설정
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      const longCheckIn = CheckIn.create({
        reservationId: reservation.id,
        deviceId: device.id,
        paymentAmount: 30000,
        reservationStartTime: twoHoursAgo
      }).confirmPayment('cash')
      
      // actualStartTime을 2시간 전으로 설정
      longCheckIn.adjustTime(twoHoursAgo)

      mockUserRepository.findById.mockResolvedValue(adminUser)
      mockCheckInRepository.findById.mockResolvedValue(longCheckIn)
      mockReservationRepository.findById.mockResolvedValue(reservation)
      mockDeviceRepository.findById.mockResolvedValue(device)
      mockCheckInRepository.update.mockImplementation(c => Promise.resolve(c))
      mockReservationRepository.update.mockImplementation(r => Promise.resolve(r))
      mockDeviceRepository.update.mockImplementation(d => Promise.resolve(d))

      // When
      const result = await useCase.execute({
        checkInId: longCheckIn.id,
        adminId: adminUser.id
      })

      // Then
      // actualDuration은 CheckIn entity에서 계산됨
      const checkedOutCheckIn = result.checkIn
      expect(checkedOutCheckIn.actualDuration).toBeGreaterThanOrEqual(119) // 약 2시간
      expect(checkedOutCheckIn.actualDuration).toBeLessThanOrEqual(121)
    })
  })

  describe('체크아웃 실패 케이스', () => {
    it('관리자가 아닌 사용자는 체크아웃을 처리할 수 없다', async () => {
      // Given
      mockUserRepository.findById.mockResolvedValue(normalUser)

      // When & Then
      await expect(useCase.execute({
        checkInId: checkIn.id,
        adminId: normalUser.id
      })).rejects.toThrow('관리자 권한이 없습니다')
    })

    it('존재하지 않는 체크인은 체크아웃할 수 없다', async () => {
      // Given
      mockUserRepository.findById.mockResolvedValue(adminUser)
      mockCheckInRepository.findById.mockResolvedValue(null)

      // When & Then
      await expect(useCase.execute({
        checkInId: 'non-existent',
        adminId: adminUser.id
      })).rejects.toThrow('체크인 정보를 찾을 수 없습니다')
    })

    it('이미 체크아웃된 체크인은 다시 체크아웃할 수 없다', async () => {
      // Given
      const checkedOutCheckIn = checkIn.checkOut()
      
      mockUserRepository.findById.mockResolvedValue(adminUser)
      mockCheckInRepository.findById.mockResolvedValue(checkedOutCheckIn)

      // When & Then
      await expect(useCase.execute({
        checkInId: checkedOutCheckIn.id,
        adminId: adminUser.id
      })).rejects.toThrow('체크인 상태가 아닙니다')
    })

    it('취소된 체크인은 체크아웃할 수 없다', async () => {
      // Given
      const cancelledCheckIn = checkIn.cancel('취소 사유')
      
      mockUserRepository.findById.mockResolvedValue(adminUser)
      mockCheckInRepository.findById.mockResolvedValue(cancelledCheckIn)

      // When & Then
      await expect(useCase.execute({
        checkInId: cancelledCheckIn.id,
        adminId: adminUser.id
      })).rejects.toThrow('체크인 상태가 아닙니다')
    })

    it('예약 정보가 없는 체크인은 체크아웃 시 에러가 발생한다', async () => {
      // Given
      mockUserRepository.findById.mockResolvedValue(adminUser)
      mockCheckInRepository.findById.mockResolvedValue(checkIn)
      mockReservationRepository.findById.mockResolvedValue(null)

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
      mockUserRepository.findById.mockResolvedValue(adminUser)
      mockCheckInRepository.findById.mockResolvedValue(checkIn)
      mockReservationRepository.findById.mockResolvedValue(reservation)
      mockDeviceRepository.findById.mockResolvedValue(null) // 기기 정보 없음
      mockCheckInRepository.update.mockImplementation(c => Promise.resolve(c))
      mockReservationRepository.update.mockImplementation(r => Promise.resolve(r))

      // When
      const result = await useCase.execute({
        checkInId: checkIn.id,
        adminId: adminUser.id
      })

      // Then
      expect(result.checkIn.status.value).toBe('completed')
      // 기기가 없어도 체크아웃은 정상 처리됨
      expect(mockDeviceRepository.update).not.toHaveBeenCalled()
    })
  })
})