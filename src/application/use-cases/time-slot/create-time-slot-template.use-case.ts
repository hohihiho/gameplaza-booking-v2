import { TimeSlotTemplate, TimeSlotType, CreditOption } from '../../../domain/entities/time-slot-template'
import { TimeSlotTemplateRepository } from '../../../domain/repositories/time-slot-template-repository.interface'
import { TimeSlotDomainService } from '../../../domain/services/time-slot-domain.service'

export interface CreateTimeSlotTemplateCommand {
  name: string
  description?: string
  type: TimeSlotType
  startHour: number
  endHour: number
  creditOptions: CreditOption[]
  enable2P: boolean
  price2PExtra?: number
  isYouthTime: boolean
  priority?: number
  isActive?: boolean
}

export interface CreateTimeSlotTemplateResult {
  template: TimeSlotTemplate
}

export class CreateTimeSlotTemplateUseCase {
  constructor(
    private readonly domainService: TimeSlotDomainService
  ) {}

  async execute(command: CreateTimeSlotTemplateCommand): Promise<CreateTimeSlotTemplateResult> {
    // 입력값 검증
    this.validateCommand(command)

    // 도메인 서비스를 통해 템플릿 생성
    const template = await this.domainService.createTemplate({
      name: command.name,
      description: command.description,
      type: command.type,
      startHour: command.startHour,
      endHour: command.endHour,
      creditOptions: command.creditOptions,
      enable2P: command.enable2P,
      price2PExtra: command.price2PExtra,
      isYouthTime: command.isYouthTime,
      priority: command.priority,
      isActive: command.isActive
    })

    return { template }
  }

  private validateCommand(command: CreateTimeSlotTemplateCommand): void {
    if (!command.name || command.name.trim().length === 0) {
      throw new Error('템플릿 이름은 필수입니다')
    }

    if (!command.type || !['early', 'overnight'].includes(command.type)) {
      throw new Error('올바른 시간대 타입을 선택해주세요')
    }

    if (!command.creditOptions || command.creditOptions.length === 0) {
      throw new Error('최소 하나 이상의 크레딧 옵션이 필요합니다')
    }

    // 크레딧 옵션 검증
    for (const option of command.creditOptions) {
      if (!['fixed', 'freeplay', 'unlimited'].includes(option.type)) {
        throw new Error('올바른 크레딧 타입을 선택해주세요')
      }

      if (!option.hours || option.hours.length === 0) {
        throw new Error('각 크레딧 옵션은 최소 하나 이상의 시간 옵션이 필요합니다')
      }

      if (!option.prices || Object.keys(option.prices).length === 0) {
        throw new Error('각 시간 옵션에 대한 가격을 설정해주세요')
      }

      // 고정크레딧인 경우 크레딧 수 필수
      if (option.type === 'fixed' && (!option.fixedCredits || option.fixedCredits <= 0)) {
        throw new Error('고정크레딧 옵션은 크레딧 수를 설정해야 합니다')
      }
    }

    // 2인 플레이 검증
    if (command.enable2P) {
      if (!command.price2PExtra || command.price2PExtra < 0) {
        throw new Error('2인 플레이가 활성화된 경우 추가 요금을 설정해야 합니다')
      }
    }
  }
}