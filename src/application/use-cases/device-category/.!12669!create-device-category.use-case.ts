import { v4 as uuidv4 } from 'uuid'
import { DeviceCategory } from '../../../domain/entities/device-category'
import { DeviceCategoryRepository } from '../../../domain/repositories/device-category.repository.interface'

export interface CreateDeviceCategoryDTO {
  name: string
  description?: string
  displayOrder?: number
}

export class CreateDeviceCategoryUseCase {
  constructor(
    private readonly categoryRepository: DeviceCategoryRepository
  ) {}

  async execute(dto: CreateDeviceCategoryDTO): Promise<DeviceCategory> {
