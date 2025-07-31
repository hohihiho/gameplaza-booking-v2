import { DeviceCategory } from '../../../domain/entities/device-category'
import { DeviceCategoryRepository } from '../../../domain/repositories/device-category.repository.interface'

export interface UpdateDeviceCategoryDTO {
  id: string
  name?: string
  description?: string
  displayOrder?: number
  isActive?: boolean
}

export class UpdateDeviceCategoryUseCase {
  constructor(
    private readonly categoryRepository: DeviceCategoryRepository
  ) {}

  async execute(dto: UpdateDeviceCategoryDTO): Promise<DeviceCategory> {
