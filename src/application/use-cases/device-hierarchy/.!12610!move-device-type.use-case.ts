import { DeviceHierarchyRepository } from '../../../domain/repositories/device-hierarchy.repository.interface'
import { DeviceTypeRepository } from '../../../domain/repositories/device-type.repository.interface'

export interface MoveDeviceTypeDTO {
  typeId: string
  targetCategoryId: string
}

export class MoveDeviceTypeUseCase {
  constructor(
    private readonly hierarchyRepository: DeviceHierarchyRepository,
    private readonly typeRepository: DeviceTypeRepository
  ) {}

  async execute(dto: MoveDeviceTypeDTO): Promise<void> {
