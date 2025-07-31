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
