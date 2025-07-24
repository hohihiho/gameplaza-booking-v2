import { TimeSlotTemplate, TimeSlotType } from '../../../domain/entities/time-slot-template'
import { TimeSlotTemplateRepository } from '../../../domain/repositories/time-slot-template-repository.interface'

export interface GetTimeSlotTemplatesQuery {
  type?: TimeSlotType
  isActive?: boolean
  isYouthTime?: boolean
  sortByPriority?: boolean
}

export interface GetTimeSlotTemplatesResult {
  templates: TimeSlotTemplate[]
  total: number
}

export class GetTimeSlotTemplatesUseCase {
  constructor(
    private readonly templateRepository: TimeSlotTemplateRepository
  ) {}

  async execute(query: GetTimeSlotTemplatesQuery): Promise<GetTimeSlotTemplatesResult> {
    let templates: TimeSlotTemplate[]

    if (query.sortByPriority) {
      // 우선순위 순으로 정렬된 템플릿 조회
      templates = await this.templateRepository.findByPriority(query.type)
      
      // 추가 필터 적용
      if (query.isActive !== undefined) {
        templates = templates.filter(t => t.isActive === query.isActive)
      }
      if (query.isYouthTime !== undefined) {
        templates = templates.filter(t => t.isYouthTime === query.isYouthTime)
      }
    } else {
      // 일반 필터링 조회
      templates = await this.templateRepository.findAll({
        type: query.type,
        isActive: query.isActive,
        isYouthTime: query.isYouthTime
      })
    }

    return {
      templates,
      total: templates.length
    }
  }
}