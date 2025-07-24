import { DeviceType } from '../entities/device-type'

export interface DeviceTypeRepository {
  findById(id: string): Promise<DeviceType | null>
  findByName(name: string): Promise<DeviceType | null>
  findByCategoryId(categoryId: string): Promise<DeviceType[]>
  findAll(): Promise<DeviceType[]>
  findActive(): Promise<DeviceType[]>
  findActiveByCategoryId(categoryId: string): Promise<DeviceType[]>
  save(type: DeviceType): Promise<DeviceType>
  update(type: DeviceType): Promise<DeviceType>
  delete(id: string): Promise<void>
  existsByNameInCategory(name: string, categoryId: string, excludeId?: string): Promise<boolean>
  getMaxDisplayOrderInCategory(categoryId: string): Promise<number>
  countByCategoryId(categoryId: string): Promise<number>
}