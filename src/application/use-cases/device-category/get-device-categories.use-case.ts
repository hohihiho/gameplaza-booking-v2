import { DeviceCategory } from '../../../domain/entities/device-category'
import { DeviceCategoryRepository } from '../../../domain/repositories/device-category.repository.interface'
import { DeviceTypeRepository } from '../../../domain/repositories/device-type.repository.interface'

export interface DeviceCategoryWithStats {
  category: DeviceCategory
  typeCount: number
}

export class GetDeviceCategoriesUseCase {
  constructor(
    private readonly categoryRepository: DeviceCategoryRepository,
    private readonly typeRepository: DeviceTypeRepository
  ) {}

  async execute(activeOnly: boolean = false): Promise<DeviceCategoryWithStats[]> {
    // tLà¬ pŒ
    const categories = activeOnly 
      ? await this.categoryRepository.findActive()
      : await this.categoryRepository.findAll()

    //  tLà¬X À…  pŒ
    const categoriesWithStats = await Promise.all(
      categories.map(async (category) => {
        const typeCount = await this.typeRepository.countByCategoryId(category.id)
        return {
          category,
          typeCount
        }
      })
    )

    // \Ü \ ,
    return categoriesWithStats.sort((a, b) => 
      a.category.displayOrder - b.category.displayOrder
    )
  }
}