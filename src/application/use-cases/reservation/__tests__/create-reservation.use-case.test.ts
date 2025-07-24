import { CreateReservationUseCase } from '../create-reservation.use-case'
import { InMemoryReservationRepository } from '@/src/infrastructure/repositories/in-memory-reservation.repository'
import { InMemoryDeviceRepository } from '@/src/infrastructure/repositories/in-memory-device.repository'
import { InMemoryUserRepository } from '@/src/infrastructure/repositories/in-memory-user.repository'
import { InMemoryTimeSlotTemplateRepository } from '@/src/infrastructure/repositories/in-memory-time-slot-template.repository'
import { TimeSlotDomainService } from '@/src/domain/services/time-slot-domain.service'
import { User } from '@/src/domain/entities/user'
import { Device } from '@/src/domain/entities/device'
import { TimeSlotTemplate } from '@/src/domain/entities/time-slot-template'
import { TimeSlot } from '@/src/domain/value-objects/time-slot'
import { CreditOption } from '@/src/domain/value-objects/credit-option'
import { Reservation } from '@/src/domain/entities/reservation'

describe('CreateReservationUseCase', () => {
  let useCase: CreateReservationUseCase
  let reservationRepository: InMemoryReservationRepository
  let deviceRepository: InMemoryDeviceRepository
  let userRepository: InMemoryUserRepository
  let timeSlotTemplateRepository: InMemoryTimeSlotTemplateRepository
  let timeSlotDomainService: TimeSlotDomainService

  beforeEach(() => {
    reservationRepository = new InMemoryReservationRepository()
    deviceRepository = new InMemoryDeviceRepository()
    userRepository = new InMemoryUserRepository()
    timeSlotTemplateRepository = new InMemoryTimeSlotTemplateRepository()
    timeSlotDomainService = new TimeSlotDomainService(timeSlotTemplateRepository)

    useCase = new CreateReservationUseCase(
      reservationRepository,
      deviceRepository,
      userRepository,
      timeSlotDomainService
    )

    // 기본 테스트 데이터 설정
    setupTestData()
  })

  function setupTestData() {
    // 사용자 생성
    const user = User.create({
      id: 'user-1',
      email: 'test@example.com',
      name: '테스트 사용자',
      birthDate: new Date(1990, 0, 1)
    })
    userRepository.save(user)

    // 기기 생성
    const device = Device.create({
      id: 'device-1',
      deviceNumber: 1,
      name: 'PC-001',
      typeId: 'type-1',
      status: 'available'
    })
    deviceRepository.save(device)

    // 시간대 템플릿 생성 (오후 시간대)
    const afternoonTemplate = TimeSlotTemplate.create({
      id: 'template-1',
      name: '오후 일반',
      dayType: 'weekday',
      deviceTypeId: 'type-1',
      timeSlot: TimeSlot.create(14, 18), // 14:00-18:00
      creditOptions: [
        CreditOption.create('fixed', 4000),
        CreditOption.create('freeplay', 5000),
        CreditOption.create('unlimited', 6000)
      ],
      enable2P: true,
      surcharge2P: 1000,
      isYouthTime: false,
      maxDuration: 12
    })
    timeSlotTemplateRepository.save(afternoonTemplate)

    // 청소년 시간대 템플릿
    const youthTemplate = TimeSlotTemplate.create({
      id: 'template-2',
      name: '청소년 시간',
      dayType: 'weekday',
      deviceTypeId: 'type-1',
      timeSlot: TimeSlot.create(9, 16), // 09:00-16:00
      creditOptions: [
        CreditOption.create('fixed', 3000),
        CreditOption.create('freeplay', 4000)
      ],
      enable2P: false,
      surcharge2P: 0,
      isYouthTime: true,
      maxDuration: 7
    })
    timeSlotTemplateRepository.save(youthTemplate)
  }

  describe('예약 생성 성공 케이스', () => {
    it('유효한 예약을 성공적으로 생성해야 한다', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateString = tomorrow.toISOString().split('T')[0]

      const result = await useCase.execute({
        userId: 'user-1',
        deviceId: 'device-1',
        date: dateString,
        startHour: 14,
        endHour: 18,
        creditType: 'freeplay',
        playerCount: 1
      })

      expect(result.reservation).toBeDefined()
      expect(result.reservationNumber).toMatch(/^GP-\d{8}-\d{4}$/)
      expect(result.totalPrice).toBe(5000)
    })

    it('2인 플레이 예약 시 추가 요금이 적용되어야 한다', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateString = tomorrow.toISOString().split('T')[0]

      const result = await useCase.execute({
        userId: 'user-1',
        deviceId: 'device-1',
        date: dateString,
        startHour: 14,
        endHour: 18,
        creditType: 'freeplay',
        playerCount: 2
      })

      expect(result.totalPrice).toBe(6000) // 5000 + 1000(2인 추가 요금)
    })
  })

  describe('사용자 검증', () => {
    it('존재하지 않는 사용자는 예약할 수 없어야 한다', async () => {
      await expect(useCase.execute({
        userId: 'non-existent',
        deviceId: 'device-1',
        date: '2025-12-01',
        startHour: 14,
        endHour: 18,
        creditType: 'freeplay',
        playerCount: 1
      })).rejects.toThrow('사용자를 찾을 수 없습니다')
    })

    it('예약 권한이 없는 사용자는 예약할 수 없어야 한다', async () => {
      const bannedUser = User.create({
        id: 'user-banned',
        email: 'banned@example.com',
        name: '차단된 사용자',
        birthDate: new Date(1990, 0, 1)
      })
      bannedUser.ban('규칙 위반')
      await userRepository.save(bannedUser)

      await expect(useCase.execute({
        userId: 'user-banned',
        deviceId: 'device-1',
        date: '2025-12-01',
        startHour: 14,
        endHour: 18,
        creditType: 'freeplay',
        playerCount: 1
      })).rejects.toThrow('예약 권한이 없습니다')
    })
  })

  describe('기기 검증', () => {
    it('존재하지 않는 기기는 예약할 수 없어야 한다', async () => {
      await expect(useCase.execute({
        userId: 'user-1',
        deviceId: 'non-existent',
        date: '2025-12-01',
        startHour: 14,
        endHour: 18,
        creditType: 'freeplay',
        playerCount: 1
      })).rejects.toThrow('기기를 찾을 수 없습니다')
    })

    it('이용 불가능한 기기는 예약할 수 없어야 한다', async () => {
      const device = await deviceRepository.findById('device-1')
      device!.changeStatus('maintenance')
      await deviceRepository.update(device!)

      await expect(useCase.execute({
        userId: 'user-1',
        deviceId: 'device-1',
        date: '2025-12-01',
        startHour: 14,
        endHour: 18,
        creditType: 'freeplay',
        playerCount: 1
      })).rejects.toThrow('해당 기기는 현재 예약이 불가능합니다')
    })
  })

  describe('시간대 검증', () => {
    it('예약 불가능한 시간대는 선택할 수 없어야 한다', async () => {
      await expect(useCase.execute({
        userId: 'user-1',
        deviceId: 'device-1',
        date: '2025-12-01',
        startHour: 20,
        endHour: 22,
        creditType: 'freeplay',
        playerCount: 1
      })).rejects.toThrow('선택한 시간대는 예약이 불가능합니다')
    })

    it('지원하지 않는 크레딧 타입은 선택할 수 없어야 한다', async () => {
      await expect(useCase.execute({
        userId: 'user-1',
        deviceId: 'device-1',
        date: '2025-12-01',
        startHour: 9,
        endHour: 16,
        creditType: 'unlimited', // 청소년 시간에는 unlimited 없음
        playerCount: 1
      })).rejects.toThrow('선택한 시간대에서는 unlimited 옵션을 사용할 수 없습니다')
    })

    it('2인 플레이가 불가능한 시간대에서는 2인을 선택할 수 없어야 한다', async () => {
      await expect(useCase.execute({
        userId: 'user-1',
        deviceId: 'device-1',
        date: '2025-12-01',
        startHour: 9,
        endHour: 16,
        creditType: 'fixed',
        playerCount: 2
      })).rejects.toThrow('해당 시간대는 2인 플레이가 불가능합니다')
    })
  })

  describe('24시간 규칙 검증', () => {
    it('24시간 이내 예약은 거부되어야 한다', async () => {
      const today = new Date()
      const dateString = today.toISOString().split('T')[0]

      await expect(useCase.execute({
        userId: 'user-1',
        deviceId: 'device-1',
        date: dateString,
        startHour: 14,
        endHour: 18,
        creditType: 'freeplay',
        playerCount: 1
      })).rejects.toThrow('예약은 시작 시간 24시간 전까지만 가능합니다')
    })
  })

  describe('시간 충돌 검증', () => {
    it('같은 기기의 시간이 겹치는 예약은 불가능해야 한다', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateString = tomorrow.toISOString().split('T')[0]

      // 첫 번째 예약 생성
      await useCase.execute({
        userId: 'user-1',
        deviceId: 'device-1',
        date: dateString,
        startHour: 14,
        endHour: 18,
        creditType: 'freeplay',
        playerCount: 1
      })

      // 겹치는 시간대 예약 시도
      await expect(useCase.execute({
        userId: 'user-2',
        deviceId: 'device-1',
        date: dateString,
        startHour: 16,
        endHour: 20,
        creditType: 'freeplay',
        playerCount: 1
      })).rejects.toThrow('해당 시간대는 이미 예약되어 있습니다')
    })
  })

  describe('1인 1기기 규칙 검증', () => {
    it('같은 시간대에 다른 기기를 예약할 수 없어야 한다', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateString = tomorrow.toISOString().split('T')[0]

      // 다른 기기 추가
      const device2 = Device.create({
        id: 'device-2',
        deviceNumber: 2,
        name: 'PC-002',
        typeId: 'type-1',
        status: 'available'
      })
      await deviceRepository.save(device2)

      // 첫 번째 예약 생성
      await useCase.execute({
        userId: 'user-1',
        deviceId: 'device-1',
        date: dateString,
        startHour: 14,
        endHour: 18,
        creditType: 'freeplay',
        playerCount: 1
      })

      // 같은 시간대 다른 기기 예약 시도
      await expect(useCase.execute({
        userId: 'user-1',
        deviceId: 'device-2',
        date: dateString,
        startHour: 14,
        endHour: 18,
        creditType: 'freeplay',
        playerCount: 1
      })).rejects.toThrow('동일 시간대에 이미 다른 기기를 예약하셨습니다')
    })
  })

  describe('예약 개수 제한 검증', () => {
    it('활성 예약이 3개를 초과하면 예약할 수 없어야 한다', async () => {
      const dates = []
      for (let i = 1; i <= 3; i++) {
        const date = new Date()
        date.setDate(date.getDate() + i)
        dates.push(date.toISOString().split('T')[0])
      }

      // 3개의 예약 생성
      for (const date of dates) {
        await useCase.execute({
          userId: 'user-1',
          deviceId: 'device-1',
          date,
          startHour: 14,
          endHour: 18,
          creditType: 'freeplay',
          playerCount: 1
        })
      }

      // 4번째 예약 시도
      const date4 = new Date()
      date4.setDate(date4.getDate() + 4)

      await expect(useCase.execute({
        userId: 'user-1',
        deviceId: 'device-1',
        date: date4.toISOString().split('T')[0],
        startHour: 14,
        endHour: 18,
        creditType: 'freeplay',
        playerCount: 1
      })).rejects.toThrow('동시에 예약 가능한 최대 개수(3개)를 초과했습니다')
    })
  })

  describe('청소년 시간대 검증', () => {
    it('성인은 청소년 시간대를 예약할 수 없어야 한다', async () => {
      const adultUser = User.create({
        id: 'user-adult',
        email: 'adult@example.com',
        name: '성인 사용자',
        birthDate: new Date(1980, 0, 1) // 45세
      })
      await userRepository.save(adultUser)

      await expect(useCase.execute({
        userId: 'user-adult',
        deviceId: 'device-1',
        date: '2025-12-01',
        startHour: 9,
        endHour: 16,
        creditType: 'fixed',
        playerCount: 1
      })).rejects.toThrow('성인은 청소년 시간대를 예약할 수 없습니다')
    })
  })
})