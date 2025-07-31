import { SupabaseClient } from '@supabase/supabase-js'
import { IDeviceRepository } from '../../domain/repositories/device.repository.interface'
import { Device, DeviceCategory, DeviceType } from '../../domain/entities/device'

interface DeviceRecord {
  id: string
  device_type_id: string
  device_number: string
  status: string
  notes: string | null
  created_at: string
  updated_at: string
}

interface DeviceTypeRecord {
  id: string
  category_id: string
  name: string
  description: string | null
  specifications: any
  hourly_rate: number
  max_reservation_hours: number
  created_at: string
}

interface DeviceCategoryRecord {
  id: string
  name: string
  description: string | null
  display_order: number
  created_at: string
}

export class SupabaseDeviceRepository implements IDeviceRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  // Device operations
  async findById(id: string): Promise<Device | null> {
    const { data, error } = await this.supabase
      .from('devices')
      .select(`
        *,
        device_types (
          id,
          name,
          category_id,
          device_categories (
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.deviceToDomain(data)
  }

  async findDeviceById(id: string): Promise<Device | null> {
    return this.findById(id)
  }

  async findDevicesByTypeId(typeId: string): Promise<Device[]> {
    const { data, error } = await this.supabase
      .from('devices')
      .select('*')
      .eq('device_type_id', typeId)
      .order('device_number', { ascending: true })

    if (error) {
      throw new Error(`Failed to find devices: ${error.message}`)
    }

    return (data || []).map(record => this.deviceToDomain(record))
  }

  async findAvailableDevicesByTypeId(typeId: string): Promise<Device[]> {
    const { data, error } = await this.supabase
      .from('devices')
      .select('*')
      .eq('device_type_id', typeId)
      .eq('status', 'available')
      .order('device_number', { ascending: true })

    if (error) {
      throw new Error(`Failed to find available devices: ${error.message}`)
    }

    return (data || []).map(record => this.deviceToDomain(record))
  }

  async saveDevice(device: Device): Promise<Device> {
    const record = this.deviceToRecord(device)
    
    const { data, error } = await this.supabase
      .from('devices')
      .insert(record)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save device: ${error.message}`)
    }

    return this.deviceToDomain(data)
  }

  async updateDevice(device: Device): Promise<Device> {
    const record = this.deviceToRecord(device)
    
    const { data, error } = await this.supabase
      .from('devices')
      .update({
        status: record.status,
        notes: record.notes,
        updated_at: record.updated_at
      })
      .eq('id', device.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update device: ${error.message}`)
    }

    return this.deviceToDomain(data)
  }

  // DeviceType operations
  async findTypeById(id: string): Promise<DeviceType | null> {
    const { data, error } = await this.supabase
      .from('device_types')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.typeToDomain(data)
  }

  async findTypesByCategoryId(categoryId: string): Promise<DeviceType[]> {
    const { data, error } = await this.supabase
      .from('device_types')
      .select('*')
      .eq('category_id', categoryId)
      .order('name', { ascending: true })

    if (error) {
      throw new Error(`Failed to find device types: ${error.message}`)
    }

    return (data || []).map(record => this.typeToDomain(record))
  }

  async saveType(type: DeviceType): Promise<DeviceType> {
    const record = this.typeToRecord(type)
    
    const { data, error } = await this.supabase
      .from('device_types')
      .insert(record)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save device type: ${error.message}`)
    }

    return this.typeToDomain(data)
  }

  // DeviceCategory operations
  async findCategoryById(id: string): Promise<DeviceCategory | null> {
    const { data, error } = await this.supabase
      .from('device_categories')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.categoryToDomain(data)
  }

  async findAllCategories(): Promise<DeviceCategory[]> {
    const { data, error } = await this.supabase
      .from('device_categories')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      throw new Error(`Failed to find categories: ${error.message}`)
    }

    return (data || []).map(record => this.categoryToDomain(record))
  }

  async saveCategory(category: DeviceCategory): Promise<DeviceCategory> {
    const record = this.categoryToRecord(category)
    
    const { data, error } = await this.supabase
      .from('device_categories')
      .insert(record)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save category: ${error.message}`)
    }

    return this.categoryToDomain(data)
  }

  // IDeviceRepository 인터페이스 구현
  async findByDeviceNumber(deviceNumber: string): Promise<Device | null> {
    const { data, error } = await this.supabase
      .from('devices')
      .select(`
        *,
        device_types (
          id,
          name,
          category_id,
          device_categories (
            id,
            name
          )
        )
      `)
      .eq('device_number', deviceNumber)
      .single()

    if (error || !data) {
      return null
    }

    return this.deviceToDomain(data)
  }

  async findAll(): Promise<Device[]> {
    const { data, error } = await this.supabase
      .from('devices')
      .select(`
        *,
        device_types (
          id,
          name,
          category_id,
          device_categories (
            id,
            name
          )
        )
      `)
      .order('device_number', { ascending: true })

    if (error) {
      throw new Error(`Failed to find devices: ${error.message}`)
    }

    return (data || []).map(record => this.deviceToDomain(record))
  }

  async findByStatus(status: any): Promise<Device[]> {
    const { data, error } = await this.supabase
      .from('devices')
      .select(`
        *,
        device_types (
          id,
          name,
          category_id,
          device_categories (
            id,
            name
          )
        )
      `)
      .eq('status', status)
      .order('device_number', { ascending: true })

    if (error) {
      throw new Error(`Failed to find devices by status: ${error.message}`)
    }

    return (data || []).map(record => this.deviceToDomain(record))
  }

  async findAvailable(): Promise<Device[]> {
    return this.findByStatus('available')
  }

  async findOperational(): Promise<Device[]> {
    const { data, error } = await this.supabase
      .from('devices')
      .select(`
        *,
        device_types (
          id,
          name,
          category_id,
          device_categories (
            id,
            name
          )
        )
      `)
      .in('status', ['available', 'in_use', 'reserved'])
      .order('device_number', { ascending: true })

    if (error) {
      throw new Error(`Failed to find operational devices: ${error.message}`)
    }

    return (data || []).map(record => this.deviceToDomain(record))
  }

  async findByTypeId(typeId: string): Promise<Device[]> {
    return this.findDevicesByTypeId(typeId)
  }

  async findByTypeIdAndStatus(typeId: string, status: any): Promise<Device[]> {
    const { data, error } = await this.supabase
      .from('devices')
      .select(`
        *,
        device_types (
          id,
          name,
          category_id,
          device_categories (
            id,
            name
          )
        )
      `)
      .eq('device_type_id', typeId)
      .eq('status', status)
      .order('device_number', { ascending: true })

    if (error) {
      throw new Error(`Failed to find devices by type and status: ${error.message}`)
    }

    return (data || []).map(record => this.deviceToDomain(record))
  }

  async findByLocation(location: string): Promise<Device[]> {
    // 위치 필드가 없으므로 빈 배열 반환
    return []
  }

  async save(device: Device): Promise<Device> {
    return this.saveDevice(device)
  }

  async update(device: Device): Promise<Device> {
    return this.updateDevice(device)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('devices')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete device: ${error.message}`)
    }
  }

  async exists(id: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('devices')
      .select('id')
      .eq('id', id)
      .single()

    return !error && !!data
  }

  async existsByDeviceNumber(deviceNumber: string, excludeId?: string): Promise<boolean> {
    let query = this.supabase
      .from('devices')
      .select('id')
      .eq('device_number', deviceNumber)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query.single()
    return !error && !!data
  }

  // UseCase에서 필요한 추가 메서드
  async countByType(typeId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('devices')
      .select('*', { count: 'exact', head: true })
      .eq('device_type_id', typeId)

    if (error) {
      throw new Error(`Failed to count devices by type: ${error.message}`)
    }

    return count || 0
  }

  // Mappers
  private deviceToDomain(record: any): Device {
    return Device.create({
      id: record.id,
      deviceTypeId: record.device_type_id,
      deviceNumber: record.device_number,
      status: record.status as any,
      notes: record.notes,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at)
    })
  }

  private deviceToRecord(device: Device): DeviceRecord {
    return {
      id: device.id,
      device_type_id: device.deviceTypeId,
      device_number: device.deviceNumber,
      status: device.status,
      notes: device.notes,
      created_at: device.createdAt.toISOString(),
      updated_at: device.updatedAt.toISOString()
    }
  }

  private typeToDomain(record: DeviceTypeRecord): DeviceType {
    return DeviceType.create({
      id: record.id,
      categoryId: record.category_id,
      name: record.name,
      description: record.description,
      specifications: record.specifications || {},
      hourlyRate: record.hourly_rate,
      maxReservationHours: record.max_reservation_hours,
      createdAt: new Date(record.created_at)
    })
  }

  private typeToRecord(type: DeviceType): DeviceTypeRecord {
    return {
      id: type.id,
      category_id: type.categoryId,
      name: type.name,
      description: type.description,
      specifications: type.specifications,
      hourly_rate: type.hourlyRate,
      max_reservation_hours: type.maxReservationHours,
      created_at: type.createdAt.toISOString()
    }
  }

  private categoryToDomain(record: DeviceCategoryRecord): DeviceCategory {
    return DeviceCategory.create({
      id: record.id,
      name: record.name,
      description: record.description,
      displayOrder: record.display_order,
      createdAt: new Date(record.created_at)
    })
  }

  private categoryToRecord(category: DeviceCategory): DeviceCategoryRecord {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      display_order: category.displayOrder,
      created_at: category.createdAt.toISOString()
    }
  }
}