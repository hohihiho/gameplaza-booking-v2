import { DeviceCategoryRepository } from '../../../domain/repositories/device-category.repository.interface'
import { DeviceTypeRepository } from '../../../domain/repositories/device-type.repository.interface'

export class DeleteDeviceCategoryUseCase {
  constructor(
    private readonly categoryRepository: DeviceCategoryRepository,
    private readonly typeRepository: DeviceTypeRepository
  ) {}

  async execute(categoryId: string): Promise<void> {
    // 카테고리 존재 확인
    const category = await this.categoryRepository.findById(categoryId)
    if (!category) {
      throw new Error('존재하지 않는 카테고리입니다')
    }

    // 하위 기기 타입 확인
    const typeCount = await this.typeRepository.countByCategoryId(categoryId)
    if (typeCount > 0) {
      throw new Error(`${typeCount}개의 하위 기기 타입이 존재하여 삭제할 수 없습니다`)
    }

    // 삭제
    await this.categoryRepository.delete(categoryId)
  }
}