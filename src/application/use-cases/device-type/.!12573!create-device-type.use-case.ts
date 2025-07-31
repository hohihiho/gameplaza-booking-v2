import { v4 as uuidv4 } from 'uuid'
import { DeviceType } from '../../../domain/entities/device-type'
import { DevicePlayMode, DevicePlayModeProps } from '../../../domain/value-objects/device-play-mode'
import { DeviceTypeRepository } from '../../../domain/repositories/device-type.repository.interface'
import { DeviceCategoryRepository } from '../../../domain/repositories/device-category.repository.interface'

export interface CreateDeviceTypeDTO {
  categoryId: string
  name: string
  manufacturer?: string
  model?: string
  description?: string
  specifications?: Record<string, any>
  defaultHourlyRate: number
  maxReservationHours: number
  minReservationHours?: number
  supportsCreditPlay?: boolean
  supportsMultiPlayer?: boolean
  playModes?: DevicePlayModeProps[]
  displayOrder?: number
  imageUrl?: string
}

export class CreateDeviceTypeUseCase {
  constructor(
    private readonly typeRepository: DeviceTypeRepository,
    private readonly categoryRepository: DeviceCategoryRepository
  ) {}

  async execute(dto: CreateDeviceTypeDTO): Promise<DeviceType> {
