import { TimeSlotDomainService } from '../../../domain/services/time-slot-domain.service'

export interface DeleteTimeSlotTemplateCommand {
  templateId: string
}

export interface DeleteTimeSlotTemplateResult {
  success: boolean
}

export class DeleteTimeSlotTemplateUseCase {
  constructor(
    private readonly domainService: TimeSlotDomainService
  ) {}

  async execute(command: DeleteTimeSlotTemplateCommand): Promise<DeleteTimeSlotTemplateResult> {
    if (!command.templateId) {
      throw new Error('템플릿 ID는 필수입니다')
    }

    await this.domainService.deleteTemplate(command.templateId)

    return { success: true }
  }
}