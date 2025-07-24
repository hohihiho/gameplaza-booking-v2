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
  async findDeviceById(id: string): Promise<Device | null> {
    const { data, error } = await this.supabase
      .from('devices')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.deviceToDomain(data)
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

  // Mappers
  private deviceToDomain(record: DeviceRecord): Device {
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