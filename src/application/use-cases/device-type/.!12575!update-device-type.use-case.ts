import { DeviceType } from '../../../domain/entities/device-type'
import { DevicePlayModeProps } from '../../../domain/value-objects/device-play-mode'
import { DeviceTypeRepository } from '../../../domain/repositories/device-type.repository.interface'

export interface UpdateDeviceTypeDTO {
  id: string
  name?: string
  manufacturer?: string
  model?: string
  description?: string
  specifications?: Record<string, any>
  defaultHourlyRate?: number
  maxReservationHours?: number
  minReservationHours?: number
  supportsCreditPlay?: boolean
  supportsMultiPlayer?: boolean
  displayOrder?: number
  isActive?: boolean
  imageUrl?: string
}

export class UpdateDeviceTypeUseCase {
  constructor(
    private readonly typeRepository: DeviceTypeRepository
  ) {}

  async execute(dto: UpdateDeviceTypeDTO): Promise<DeviceType> {
