import { CreateTimeSlotTemplateUseCase } from '../create-time-slot-template.use-case'
import { TimeSlotDomainService } from '@/src/domain/services/time-slot-domain.service'
import { TimeSlotTemplate } from '@/src/domain/entities/time-slot-template'
import { TimeSlot } from '@/src/domain/value-objects/time-slot'

describe('CreateTimeSlotTemplateUseCase', () => {
  let useCase: CreateTimeSlotTemplateUseCase
  let mockDomainService: jest.Mocked<TimeSlotDomainService>

  beforeEach(() => {
    mockDomainService = {
      createTemplate: jest.fn()
    } as any

    useCase = new CreateTimeSlotTemplateUseCase(mockDomainService)
  })

  const validCommand = {
    name: '조기대여',
    description: '오전 시간대',
    type: 'early' as const,
    startHour: 10,
    endHour: 14,
    creditOptions: [
      {
        type: 'fixed' as const,
        hours: [4],
        prices: { 4: 25000 },
        fixedCredits: 100
      }
    ],
    enable2P: true,
    price2PExtra: 10000,
    isYouthTime: true,
    priority: 1,
    isActive: true
  }

  describe('execute', () => {
    it('유효한 입력으로 템플릿을 생성할 수 있다', async () => {
      const mockTemplate = TimeSlotTemplate.create({
        id: 'test-id',
        ...validCommand,
        timeSlot: TimeSlot.create(validCommand.startHour, validCommand.endHour)
      })

      mockDomainService.createTemplate.mockResolvedValue(mockTemplate)

      const result = await useCase.execute(validCommand)

      expect(mockDomainService.createTemplate).toHaveBeenCalledWith(validCommand)
      expect(result.template).toEqual(mockTemplate)
    })

    it('템플릿 이름이 없으면 에러를 발생시킨다', async () => {
      const command = { ...validCommand, name: '' }

      await expect(useCase.execute(command))
        .rejects.toThrow('템플릿 이름은 필수입니다')
    })

    it('잘못된 타입이면 에러를 발생시킨다', async () => {
      const command = { ...validCommand, type: 'invalid' as any }

      await expect(useCase.execute(command))
        .rejects.toThrow('올바른 시간대 타입을 선택해주세요')
    })

    it('크레딧 옵션이 없으면 에러를 발생시킨다', async () => {
      const command = { ...validCommand, creditOptions: [] }

      await expect(useCase.execute(command))
        .rejects.toThrow('최소 하나 이상의 크레딧 옵션이 필요합니다')
    })

    it('잘못된 크레딧 타입이면 에러를 발생시킨다', async () => {
      const command = {
        ...validCommand,
        creditOptions: [{
          type: 'invalid' as any,
          hours: [4],
          prices: { 4: 25000 }
        }]
      }

      await expect(useCase.execute(command))
        .rejects.toThrow('올바른 크레딧 타입을 선택해주세요')
    })

    it('시간 옵션이 없으면 에러를 발생시킨다', async () => {
      const command = {
        ...validCommand,
        creditOptions: [{
          type: 'fixed' as const,
          hours: [],
          prices: {},
          fixedCredits: 100
        }]
      }

      await expect(useCase.execute(command))
        .rejects.toThrow('각 크레딧 옵션은 최소 하나 이상의 시간 옵션이 필요합니다')
    })

    it('가격이 설정되지 않으면 에러를 발생시킨다', async () => {
      const command = {
        ...validCommand,
        creditOptions: [{
          type: 'fixed' as const,
          hours: [4],
          prices: {},
          fixedCredits: 100
        }]
      }

      await expect(useCase.execute(command))
        .rejects.toThrow('각 시간 옵션에 대한 가격을 설정해주세요')
    })

    it('고정크레딧에 크레딧 수가 없으면 에러를 발생시킨다', async () => {
      const command = {
        ...validCommand,
        creditOptions: [{
          type: 'fixed' as const,
          hours: [4],
          prices: { 4: 25000 }
        }]
      }

      await expect(useCase.execute(command))
        .rejects.toThrow('고정크레딧 옵션은 크레딧 수를 설정해야 합니다')
    })

    it('2인 플레이가 활성화되었지만 추가 요금이 없으면 에러를 발생시킨다', async () => {
      const command = {
        ...validCommand,
        enable2P: true,
        price2PExtra: undefined
      }

      await expect(useCase.execute(command))
        .rejects.toThrow('2인 플레이가 활성화된 경우 추가 요금을 설정해야 합니다')
    })

    it('2인 플레이 추가 요금이 음수면 에러를 발생시킨다', async () => {
      const command = {
        ...validCommand,
        enable2P: true,
        price2PExtra: -1000
      }

      await expect(useCase.execute(command))
        .rejects.toThrow('2인 플레이가 활성화된 경우 추가 요금을 설정해야 합니다')
    })

    it('도메인 서비스에서 발생한 에러를 전파한다', async () => {
      mockDomainService.createTemplate.mockRejectedValue(
        new Error('이미 존재하는 템플릿 이름입니다')
      )

      await expect(useCase.execute(validCommand))
        .rejects.toThrow('이미 존재하는 템플릿 이름입니다')
    })
  })
})