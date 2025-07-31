import { DeviceType } from '../../../domain/entities/device-type'
import { DevicePlayMode, DevicePlayModeProps } from '../../../domain/value-objects/device-play-mode'
import { DeviceTypeRepository } from '../../../domain/repositories/device-type.repository.interface'

export class ManagePlayModesUseCase {
  constructor(
    private readonly typeRepository: DeviceTypeRepository
  ) {}

  /**
