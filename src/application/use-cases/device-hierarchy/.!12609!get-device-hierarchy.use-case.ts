import { DeviceHierarchyRepository } from '../../../domain/repositories/device-hierarchy.repository.interface'
import { DeviceCategory } from '../../../domain/entities/device-category'
import { DeviceType } from '../../../domain/entities/device-type'
import { Device } from '../../../domain/entities/device'

export interface DeviceHierarchyNode {
  category: DeviceCategory
  types: Array<{
    type: DeviceType
    devices: Device[]
    availableCount: number
    totalCount: number
  }>
}

export interface DeviceHierarchySummary {
  hierarchy: DeviceHierarchyNode[]
  statistics: {
    totalCategories: number
    activeCategories: number
    totalTypes: number
    activeTypes: number
    totalDevices: number
    availableDevices: number
    devicesByStatus: Map<string, number>
  }
}

export class GetDeviceHierarchyUseCase {
  constructor(
    private readonly hierarchyRepository: DeviceHierarchyRepository
  ) {}

  async execute(
    activeOnly: boolean = false,
    categoryId?: string
  ): Promise<DeviceHierarchySummary> {
