import { DeviceCategory } from '../entities/device-category'

export interface DeviceCategoryRepository {
  findById(id: string): Promise<DeviceCategory | null>
  findByName(name: string): Promise<DeviceCategory | null>
  findAll(): Promise<DeviceCategory[]>
  findActive(): Promise<DeviceCategory[]>
  save(category: DeviceCategory): Promise<DeviceCategory>
  update(category: DeviceCategory): Promise<DeviceCategory>
  delete(id: string): Promise<void>
  existsByName(name: string, excludeId?: string): Promise<boolean>
  getMaxDisplayOrder(): Promise<number>
}