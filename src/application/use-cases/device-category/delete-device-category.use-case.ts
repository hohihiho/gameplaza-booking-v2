import { DeviceCategoryRepository } from '../../../domain/repositories/device-category.repository.interface'
import { DeviceTypeRepository } from '../../../domain/repositories/device-type.repository.interface'

export class DeleteDeviceCategoryUseCase {
  constructor(
    private readonly categoryRepository: DeviceCategoryRepository,
    private readonly typeRepository: DeviceTypeRepository
  ) {}

  async execute(categoryId: string): Promise<void> {
    // tL� t� Ux
    const category = await this.categoryRepository.findById(categoryId)
    if (!category) {
      throw new Error('t�X� J� tLଅ��')
    }

    // X �� t� Ux
    const typeCount = await this.typeRepository.countByCategoryId(categoryId)
    if (typeCount > 0) {
      throw new Error(`${typeCount}X X 0�t �� tLଔ �`  Ƶ��`)
    }

    // �
    await this.categoryRepository.delete(categoryId)
  }
}