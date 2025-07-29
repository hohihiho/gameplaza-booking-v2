import { GetAvailableTimeSlotsUseCase } from '../get-available-time-slots.use-case'
import { TimeSlotDomainService } from '@/src/domain/services/time-slot-domain.service'
import { ReservationRepository } from '@/src/domain/repositories/reservation-repository.interface'
import { DeviceRepository } from '@/src/domain/repositories/device-repository.interface'
import { TimeSlotTemplate } from '@/src/domain/entities/time-slot-template'
import { TimeSlot } from '@/src/domain/value-objects/time-slot'
import { Device } from '@/src/domain/entities/device'

describe('GetAvailableTimeSlotsUseCase', () => {
  let useCase: GetAvailableTimeSlotsUseCase
  let mockDomainService: jest.Mocked<TimeSlotDomainService>
  let mockReservationRepository: jest.Mocked<ReservationRepository>
  let mockDeviceRepository: jest.Mocked<DeviceRepository>

  beforeEach(() => {
    mockDomainService = {
      getAvailableTimeSlots: jest.fn()
    } as any

    mockReservationRepository = {
      findByTimeSlot: jest.fn()
    } as any

    mockDeviceRepository = {
      findById: jest.fn(),
      countByType: jest.fn()
    } as any

    useCase = new GetAvailableTimeSlotsUseCase(
      mockDomainService,
      mockReservationRepository,
      mockDeviceRepository
    )
  })

  const validQuery = {
    date: '2025-07-30',
    deviceId: '123e4567-e89b-12d3-a456-426614174000',
    isYouth: false
  }

  const mockDevice = Device.create({
    id: validQuery.deviceId,
    typeId: 'type-1',
    typeName: '마이마이',
    deviceNumber: 1,
    location: '1층',
    status: 'available',
    isActive: true
  })

  const mockTemplate = TimeSlotTemplate.create({
    id: 'template-1',
    name: '조기대여',
    type: 'early',
    timeSlot: TimeSlot.create(10, 14),
    creditOptions: [{
      type: 'fixed' as const,
      hours: [4],
      prices: { 4: 25000 },
      fixedCredits: 100
    }],
    enable2P: true,
    price2PExtra: 10000,
    isYouthTime: true,
    priority: 1,
    isActive: true
  })

  describe('execute', () => {
    beforeEach(() => {
      mockDeviceRepository.findById.mockResolvedValue(mockDevice)
      mockDomainService.getAvailableTimeSlots.mockResolvedValue([mockTemplate])
      mockReservationRepository.findByTimeSlot.mockResolvedValue([])
      mockDeviceRepository.countByType.mockResolvedValue(2)
    })

    it('예약 가능한 시간대를 조회할 수 있다', async () => {
      const result = await useCase.execute(validQuery)

      expect(mockDeviceRepository.findById).toHaveBeenCalledWith(validQuery.deviceId)
      expect(mockDomainService.getAvailableTimeSlots).toHaveBeenCalledWith(
        new Date(2025, 6, 30),
        mockDevice.typeId
      )
      expect(result.slots).toHaveLength(1)
      expect(result.slots[0]).toMatchObject({
        timeSlot: {
          id: mockTemplate.id,
          startHour: 10,
          endHour: 14,
          duration: 4
        },
        available: true,
        remainingSlots: 2,
        creditOptions: mockTemplate.creditOptions,
        enable2P: true,
        price2PExtra: 10000,
        isYouthTime: true
      })
    })

    it('청소년인 경우 청소년 시간대만 필터링한다', async () => {
      const youthQuery = { ...validQuery, isYouth: true }
      const adultTemplate = TimeSlotTemplate.create({
        id: 'template-2',
        name: '밤샘대여',
        type: 'overnight',
        timeSlot: TimeSlot.create(22, 26),
        creditOptions: [{
          type: 'freeplay' as const,
          hours: [4],
          prices: { 4: 40000 }
        }],
        enable2P: false,
        isYouthTime: false,
        priority: 1,
        isActive: true
      })

      mockDomainService.getAvailableTimeSlots.mockResolvedValue([
        mockTemplate,
        adultTemplate
      ])

      const result = await useCase.execute(youthQuery)

      expect(result.slots).toHaveLength(1)
      expect(result.slots[0].timeSlot.name).toBe('조기대여')
    })

    it('예약이 차있으면 남은 슬롯 수가 감소한다', async () => {
      mockReservationRepository.findByTimeSlot.mockResolvedValue([
        {} as any // 1개 예약 존재
      ])
      mockDeviceRepository.countByType.mockResolvedValue(2) // 총 2대

      const result = await useCase.execute(validQuery)

      expect(result.slots[0].remainingSlots).toBe(1)
      expect(result.slots[0].available).toBe(true)
    })

    it('예약이 꽉 차면 available이 false가 된다', async () => {
      mockReservationRepository.findByTimeSlot.mockResolvedValue([
        {} as any, {} as any // 2개 예약 존재
      ])
      mockDeviceRepository.countByType.mockResolvedValue(2) // 총 2대

      const result = await useCase.execute(validQuery)

      expect(result.slots[0].remainingSlots).toBe(0)
      expect(result.slots[0].available).toBe(false)
    })

    it('잘못된 날짜 형식이면 에러를 발생시킨다', async () => {
      const query = { ...validQuery, date: '2025/07/30' }

      await expect(useCase.execute(query))
        .rejects.toThrow('올바른 날짜 형식(YYYY-MM-DD)을 입력해주세요')
    })

    it('기기 ID가 없으면 에러를 발생시킨다', async () => {
      const query = { ...validQuery, deviceId: '' }

      await expect(useCase.execute(query))
        .rejects.toThrow('기기 ID는 필수입니다')
    })

    it('과거 날짜면 에러를 발생시킨다', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const query = { 
        ...validQuery, 
        date: yesterday.toISOString().split('T')[0]
      }

      await expect(useCase.execute(query))
        .rejects.toThrow('과거 날짜의 시간대는 조회할 수 없습니다')
    })

    it('기기를 찾을 수 없으면 에러를 발생시킨다', async () => {
      mockDeviceRepository.findById.mockResolvedValue(null)

      await expect(useCase.execute(validQuery))
        .rejects.toThrow('기기를 찾을 수 없습니다')
    })
  })
})