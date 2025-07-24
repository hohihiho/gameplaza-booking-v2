import { TimeSlotTemplate, CreditOption } from '../../../domain/entities/time-slot-template'
import { TimeSlotTemplateRepository } from '../../../domain/repositories/time-slot-template-repository.interface'
import { TimeSlotDomainService } from '../../../domain/services/time-slot-domain.service'

export interface UpdateTimeSlotTemplateCommand {
  templateId: string
  name?: string
  description?: string
  creditOptions?: CreditOption[]
  enable2P?: boolean
  price2PExtra?: number
  isYouthTime?: boolean
  priority?: number
  isActive?: boolean
}

export interface UpdateTimeSlotTemplateResult {
  template: TimeSlotTemplate
}

export class UpdateTimeSlotTemplateUseCase {
  constructor(
    private readonly domainService: TimeSlotDomainService
  ) {}

  async execute(command: UpdateTimeSlotTemplateCommand): Promise<UpdateTimeSlotTemplateResult> {
    // 입력값 검증
    this.validateCommand(command)

    // 도메인 서비스를 통해 템플릿 수정
    const template = await this.domainService.updateTemplate(
      command.templateId,
      {
        name: command.name,
        description: command.description,
        creditOptions: command.creditOptions,
        enable2P: command.enable2P,
        price2PExtra: command.price2PExtra,
        isYouthTime: command.isYouthTime,
        priority: command.priority,
        isActive: command.isActive
      }
    )

    return { template }
  }

  private validateCommand(command: UpdateTimeSlotTemplateCommand): void {
    if (!command.templateId) {
      throw new Error('템플릿 ID는 필수입니다')
    }

    // 이름 수정 시 검증
    if (command.name !== undefined && command.name.trim().length === 0) {
      throw new Error('템플릿 이름은 비워둘 수 없습니다')
    }

    // 크레딧 옵션 수정 시 검증
    if (command.creditOptions) {
      if (command.creditOptions.length === 0) {
        throw new Error('최소 하나 이상의 크레딧 옵션이 필요합니다')
      }

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

        if (option.type === 'fixed' && (!option.fixedCredits || option.fixedCredits <= 0)) {
          throw new Error('고정크레딧 옵션은 크레딧 수를 설정해야 합니다')
        }
      }
    }

    // 2인 플레이 검증
    if (command.enable2P !== undefined && command.enable2P) {
      if (command.price2PExtra !== undefined && command.price2PExtra < 0) {
        throw new Error('2인 플레이 추가 요금은 0원 이상이어야 합니다')
      }
    }
  }
}