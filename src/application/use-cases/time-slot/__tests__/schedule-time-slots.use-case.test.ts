import { ScheduleTimeSlotsUseCase } from '../schedule-time-slots.use-case'
import { TimeSlotDomainService } from '@/src/domain/services/time-slot-domain.service'
import { TimeSlotSchedule } from '@/src/domain/entities/time-slot-schedule'
import { TimeSlotTemplate } from '@/src/domain/entities/time-slot-template'
import { TimeSlot } from '@/src/domain/value-objects/time-slot'

describe('ScheduleTimeSlotsUseCase', () => {
  let useCase: ScheduleTimeSlotsUseCase
  let mockDomainService: jest.Mocked<TimeSlotDomainService>

  beforeEach(() => {
    mockDomainService = {
      scheduleTimeSlots: jest.fn()
    } as any

    useCase = new ScheduleTimeSlotsUseCase(mockDomainService)
  })

  const validCommand = {
    date: '2025-07-30',
    deviceTypeId: '123e4567-e89b-12d3-a456-426614174000',
    templateIds: ['template-1', 'template-2']
  }

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
    enable2P: false,
    isYouthTime: true,
    priority: 1,
    isActive: true
  })

  const mockSchedule = TimeSlotSchedule.create({
    id: 'schedule-1',
    date: new Date(2025, 6, 30),
    deviceTypeId: validCommand.deviceTypeId,
    templates: [mockTemplate]
  })

  describe('execute', () => {
    it('유효한 입력으로 스케줄을 생성할 수 있다', async () => {
      mockDomainService.scheduleTimeSlots.mockResolvedValue([mockSchedule])

      const result = await useCase.execute(validCommand)

      expect(mockDomainService.scheduleTimeSlots).toHaveBeenCalledWith({
        date: new Date(2025, 6, 30),
        deviceTypeId: validCommand.deviceTypeId,
        templateIds: validCommand.templateIds,
        repeat: undefined
      })
      expect(result.schedules).toEqual([mockSchedule])
      expect(result.count).toBe(1)
    })

    it('반복 설정으로 스케줄을 생성할 수 있다', async () => {
      const commandWithRepeat = {
        ...validCommand,
        repeat: {
          type: 'weekly' as const,
          endDate: '2025-08-30',
          daysOfWeek: [1, 3, 5] // 월, 수, 금
        }
      }

      mockDomainService.scheduleTimeSlots.mockResolvedValue([mockSchedule])

      const result = await useCase.execute(commandWithRepeat)

      expect(mockDomainService.scheduleTimeSlots).toHaveBeenCalledWith({
        date: new Date(2025, 6, 30),
        deviceTypeId: validCommand.deviceTypeId,
        templateIds: validCommand.templateIds,
        repeat: {
          type: 'weekly',
          endDate: new Date(2025, 7, 30),
          daysOfWeek: [1, 3, 5]
        }
      })
    })

    it('잘못된 날짜 형식이면 에러를 발생시킨다', async () => {
      const command = { ...validCommand, date: '2025/07/30' }

      await expect(useCase.execute(command))
        .rejects.toThrow('올바른 날짜 형식(YYYY-MM-DD)을 입력해주세요')
    })

    it('기기 타입 ID가 없으면 에러를 발생시킨다', async () => {
      const command = { ...validCommand, deviceTypeId: '' }

      await expect(useCase.execute(command))
        .rejects.toThrow('기기 타입 ID는 필수입니다')
    })

    it('템플릿 ID가 없으면 에러를 발생시킨다', async () => {
      const command = { ...validCommand, templateIds: [] }

      await expect(useCase.execute(command))
        .rejects.toThrow('최소 하나 이상의 템플릿을 선택해주세요')
    })

    it('잘못된 반복 타입이면 에러를 발생시킨다', async () => {
      const command = {
        ...validCommand,
        repeat: {
          type: 'invalid' as any,
          endDate: '2025-08-30'
        }
      }

      await expect(useCase.execute(command))
        .rejects.toThrow('올바른 반복 타입을 선택해주세요')
    })

    it('반복 종료일이 시작일보다 이전이면 에러를 발생시킨다', async () => {
      const command = {
        ...validCommand,
        repeat: {
          type: 'daily' as const,
          endDate: '2025-07-25'
        }
      }

      await expect(useCase.execute(command))
        .rejects.toThrow('반복 종료일은 시작일 이후여야 합니다')
    })

    it('주간 반복이 아닌데 요일을 설정하면 에러를 발생시킨다', async () => {
      const command = {
        ...validCommand,
        repeat: {
          type: 'daily' as const,
          endDate: '2025-08-30',
          daysOfWeek: [1, 2, 3]
        }
      }

      await expect(useCase.execute(command))
        .rejects.toThrow('요일 선택은 주간 반복에서만 사용 가능합니다')
    })

    it('잘못된 요일 값이면 에러를 발생시킨다', async () => {
      const command = {
        ...validCommand,
        repeat: {
          type: 'weekly' as const,
          endDate: '2025-08-30',
          daysOfWeek: [-1, 7, 10]
        }
      }

      await expect(useCase.execute(command))
        .rejects.toThrow('요일은 0(일요일)부터 6(토요일) 사이의 값이어야 합니다')
    })
  })
})