import { CreateReservationUseCase } from '../create-reservation.use-case'
import { TimeSlotDomainService } from '@/src/domain/services/time-slot-domain.service'
import { User } from '@/src/domain/entities/user'
import { Device } from '@/src/domain/entities/device'
import { TimeSlotTemplate } from '@/src/domain/entities/time-slot-template'
import { TimeSlot } from '@/src/domain/value-objects/time-slot'
import { Reservation } from '@/src/domain/entities/reservation'

describe('CreateReservationUseCase', () => {
  let useCase: CreateReservationUseCase
  let mockReservationRepository: any
  let mockDeviceRepository: any
  let mockUserRepository: any
  let mockTimeSlotTemplateRepository: any
  let mockTimeSlotScheduleRepository: any
  let timeSlotDomainService: TimeSlotDomainService

  // Test data storage
  const users = new Map<string, User>()
  const devices = new Map<string, Device>()
  const timeSlotTemplates = new Map<string, TimeSlotTemplate>()
  const reservations = new Map<string, Reservation>()

  beforeEach(() => {
    // Clear test data
    users.clear()
    devices.clear()
    timeSlotTemplates.clear()
    reservations.clear()

    // Setup mock repositories
    mockReservationRepository = {
      save: jest.fn().mockImplementation(async (reservation: Reservation) => {
        reservations.set(reservation.id, reservation)
        return reservation
      }),
      findById: jest.fn().mockImplementation(async (id: string) => {
        return reservations.get(id) || null
      }),
      findByUserId: jest.fn().mockImplementation(async (userId: string, statuses?: string[]) => {
        let userReservations = Array.from(reservations.values()).filter(r => r.userId === userId)
        if (statuses) {
          userReservations = userReservations.filter(r => statuses.includes(r.status.value))
        }
        return userReservations
      }),
      findByDeviceAndDateRange: jest.fn().mockImplementation(async (deviceId: string, startDate: Date, endDate: Date) => {
        return Array.from(reservations.values()).filter(r => 
          r.deviceId === deviceId &&
          r.startDateTime.toDate() < endDate &&
          r.endDateTime.toDate() > startDate
        )
      }),
      findByUserAndTimeRange: jest.fn().mockImplementation(async (userId: string, startDate: Date, endDate: Date) => {
        return Array.from(reservations.values()).filter(r => 
          r.userId === userId &&
          r.startDateTime.toDate() < endDate &&
          r.endDateTime.toDate() > startDate
        )
      }),
      findActiveByUserId: jest.fn().mockImplementation(async (userId: string) => {
        return Array.from(reservations.values()).filter(r => 
          r.userId === userId && 
          ['pending', 'approved'].includes(r.status.value)
        )
      }),
      update: jest.fn().mockImplementation(async (reservation: Reservation) => {
        reservations.set(reservation.id, reservation)
        return reservation
      }),
      generateReservationNumber: jest.fn().mockResolvedValue('GP-20251201-0001')
    }

    mockDeviceRepository = {
      findById: jest.fn().mockImplementation(async (id: string) => {
        return devices.get(id) || null
      }),
      save: jest.fn().mockImplementation(async (device: Device) => {
        devices.set(device.id, device)
        return device
      }),
      update: jest.fn().mockImplementation(async (device: Device) => {
        devices.set(device.id, device)
        return device
      })
    }

    mockUserRepository = {
      findById: jest.fn().mockImplementation(async (id: string) => {
        return users.get(id) || null
      }),
      save: jest.fn().mockImplementation(async (user: User) => {
        users.set(user.id, user)
        return user
      })
    }

    mockTimeSlotTemplateRepository = {
      findById: jest.fn().mockImplementation(async (id: string) => {
        return timeSlotTemplates.get(id) || null
      }),
      save: jest.fn().mockImplementation(async (template: TimeSlotTemplate) => {
        timeSlotTemplates.set(template.id, template)
        return template
      }),
      findAll: jest.fn().mockImplementation(async (filter?: any) => {
        let templates = Array.from(timeSlotTemplates.values())
        if (filter?.isActive !== undefined) {
          templates = templates.filter(t => t.isActive === filter.isActive)
        }
        return templates
      }),
      findByName: jest.fn().mockImplementation(async (name: string) => {
        return Array.from(timeSlotTemplates.values()).find(t => t.name === name) || null
      }),
      findConflicting: jest.fn().mockResolvedValue([]),
      delete: jest.fn()
    }

    mockTimeSlotScheduleRepository = {
      findByDateAndDeviceType: jest.fn().mockResolvedValue(null),
      findByTemplateId: jest.fn().mockResolvedValue([]),
      save: jest.fn()
    }

    timeSlotDomainService = new TimeSlotDomainService(
      mockTimeSlotTemplateRepository,
      mockTimeSlotScheduleRepository
    )

    useCase = new CreateReservationUseCase(
      mockReservationRepository,
      mockDeviceRepository,
      mockUserRepository,
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
      fullName: '테스트 사용자',
      birthDate: new Date(1990, 0, 1)
    })
    users.set(user.id, user)

    // 기기 생성
    const device = Device.create({
      id: 'device-1',
      deviceNumber: 1,
      name: 'PC-001',
      typeId: 'type-1',
      status: 'available'
    })
    devices.set(device.id, device)

    // 시간대 템플릿 생성 (오후 시간대)
    const afternoonTemplate = TimeSlotTemplate.create({
      id: 'template-1',
      name: '오후 일반',
      type: 'early',
      timeSlot: TimeSlot.create(14, 18), // 14:00-18:00
      creditOptions: [
        {
          type: 'fixed',
          hours: [1, 2, 3, 4],
          prices: { 1: 3000, 2: 5000, 3: 7000, 4: 9000 },
          fixedCredits: 1
        },
        {
          type: 'freeplay',
          hours: [1, 2, 3, 4],
          prices: { 1: 3000, 2: 5000, 3: 7000, 4: 9000 }
        }
      ],
      enable2P: true,
      price2PExtra: 1000,
      isYouthTime: false,
      priority: 1,
      isActive: true
    })
    timeSlotTemplates.set(afternoonTemplate.id, afternoonTemplate)

    // 청소년 시간대 템플릿
    const youthTemplate = TimeSlotTemplate.create({
      id: 'template-2',
      name: '청소년 시간',
      type: 'early',
      timeSlot: TimeSlot.create(9, 16), // 09:00-16:00
      creditOptions: [{
        type: 'fixed',
        hours: [1, 2, 3, 4, 5, 6, 7],
        prices: { 1: 3000, 2: 5000, 3: 7000, 4: 9000, 5: 11000, 6: 13000, 7: 15000 },
        fixedCredits: 1
      }],
      enable2P: false,
      price2PExtra: 0,
      isYouthTime: true,
      priority: 2,
      isActive: true
    })
    timeSlotTemplates.set(youthTemplate.id, youthTemplate)
  }

  describe('예약 생성 성공 케이스', () => {
    it('유효한 예약을 성공적으로 생성해야 한다', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 2) // 2일 후로 설정
      const dateString = futureDate.toISOString().split('T')[0]

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
      expect(result.totalPrice).toBe(9000) // 4시간 * freeplay 가격
    })

    it('2인 플레이 예약 시 추가 요금이 적용되어야 한다', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 2) // 2일 후로 설정
      const dateString = futureDate.toISOString().split('T')[0]

      const result = await useCase.execute({
        userId: 'user-1',
        deviceId: 'device-1',
        date: dateString,
        startHour: 14,
        endHour: 18,
        creditType: 'freeplay',
        playerCount: 2
      })

      expect(result.totalPrice).toBe(10000) // 9000 + 1000(2인 추가 요금)
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
        fullName: '차단된 사용자',
        birthDate: new Date(1990, 0, 1)
      })
      const bannedUserAfter = bannedUser.ban('규칙 위반')
      users.set(bannedUser.id, bannedUserAfter)

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
      const device = devices.get('device-1')!
      const updatedDevice = device.changeStatus('maintenance')
      devices.set(device.id, updatedDevice)

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
      })).rejects.toThrow('과거 날짜에는 예약할 수 없습니다')
    })
  })

  describe('시간 충돌 검증', () => {
    it('같은 기기의 시간이 겹치는 예약은 불가능해야 한다', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 2) // 2일 후로 설정
      const dateString = futureDate.toISOString().split('T')[0]

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

      // 두 번째 사용자 추가
      const user2 = User.create({
        id: 'user-2',
        email: 'test2@example.com',
        fullName: '테스트 사용자2',
        birthDate: new Date(1990, 0, 1)
      })
      users.set(user2.id, user2)

      // 겹치는 시간대 예약 시도
      await expect(useCase.execute({
        userId: 'user-2',
        deviceId: 'device-1',
        date: dateString,
        startHour: 16,
        endHour: 20,
        creditType: 'freeplay',
        playerCount: 1
      })).rejects.toThrow('선택한 시간대는 예약이 불가능합니다')
    })
  })

  describe('1인 1기기 규칙 검증', () => {
    it('같은 시간대에 다른 기기를 예약할 수 없어야 한다', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 2) // 2일 후로 설정
      const dateString = futureDate.toISOString().split('T')[0]

      // 다른 기기 추가
      const device2 = Device.create({
        id: 'device-2',
        deviceNumber: 2,
        name: 'PC-002',
        typeId: 'type-1',
        status: 'available'
      })
      devices.set(device2.id, device2)

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
      })).rejects.toThrow('이미 해당 시간대에 예약이 있습니다')
    })
  })

  describe('예약 개수 제한 검증', () => {
    it('활성 예약이 1개를 초과하면 예약할 수 없어야 한다', async () => {
      const dates = []
      for (let i = 2; i <= 4; i++) { // 2일 후부터 시작
        const date = new Date()
        date.setDate(date.getDate() + i)
        dates.push(date.toISOString().split('T')[0])
      }

      // 첫 번째 예약 생성하고 승인 상태로 변경
      const firstDate = new Date()
      firstDate.setDate(firstDate.getDate() + 2)
      const firstReservation = await useCase.execute({
        userId: 'user-1',
        deviceId: 'device-1',
        date: firstDate.toISOString().split('T')[0],
        startHour: 14,
        endHour: 18,
        creditType: 'freeplay',
        playerCount: 1
      })
      
      // 예약을 승인 상태로 변경
      const savedReservation = reservations.get(firstReservation.reservation.id)!
      const approvedReservation = savedReservation.approve()
      reservations.set(savedReservation.id, approvedReservation)
      
      // 예약이 활성 상태인지 확인
      expect(approvedReservation.isActive()).toBe(true)

      // 추가 기기 생성
      const device2 = Device.create({
        id: 'device-2',
        deviceNumber: 2,
        name: 'PC-002',
        typeId: 'type-1',
        status: 'available'
      })
      devices.set(device2.id, device2)

      // 두 번째 예약 시도 (다른 날짜, 다른 기기)
      const secondDate = new Date()
      secondDate.setDate(secondDate.getDate() + 3)

      await expect(useCase.execute({
        userId: 'user-1',
        deviceId: 'device-2',
        date: secondDate.toISOString().split('T')[0],
        startHour: 14,
        endHour: 18,
        creditType: 'freeplay',
        playerCount: 1
      })).rejects.toThrow('1인당 동시 예약 가능 건수는 1건입니다')
    })
  })

  describe('청소년 시간대 검증', () => {
    it('성인은 청소년 시간대를 예약할 수 없어야 한다', async () => {
      const adultUser = User.create({
        id: 'user-adult',
        email: 'adult@example.com',
        fullName: '성인 사용자',
        birthDate: new Date(1980, 0, 1) // 45세
      })
      users.set(adultUser.id, adultUser)

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 2)
      const dateString = futureDate.toISOString().split('T')[0]

      await expect(useCase.execute({
        userId: 'user-adult',
        deviceId: 'device-1',
        date: dateString,
        startHour: 9,
        endHour: 16,
        creditType: 'fixed',
        playerCount: 1
      })).rejects.toThrow('성인은 청소년 시간대를 예약할 수 없습니다')
    })
  })
})