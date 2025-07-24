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
    // Ä5 lp \Ü
    const hierarchy = categoryId
      ? await this.hierarchyRepository.loadHierarchyByCategory(categoryId)
      : await this.hierarchyRepository.loadFullHierarchy()

    // ¸¬ lp Ý1
    const tree = hierarchy.toTree()
    
    // \1 m©Ì D0Á (5X)
    const filteredTree = activeOnly
      ? tree
          .filter(node => node.category.isActive)
          .map(node => ({
            ...node,
            types: node.types
              .filter(typeNode => typeNode.type.isActive)
              .map(typeNode => ({
                ...typeNode,
                devices: typeNode.devices.filter(device => 
                  device.status.value !== 'broken'
                )
              }))
          }))
      : tree

    // xÜ ô l1
    const hierarchyNodes: DeviceHierarchyNode[] = filteredTree.map(node => ({
      category: node.category,
      types: node.types.map(typeNode => ({
        type: typeNode.type,
        devices: typeNode.devices,
        availableCount: typeNode.devices.filter(d => d.canBeReserved()).length,
        totalCount: typeNode.devices.length
      }))
    }))

    // µÄ ô
    const statistics = hierarchy.getStatistics()

    return {
      hierarchy: hierarchyNodes,
      statistics
    }
  }
}