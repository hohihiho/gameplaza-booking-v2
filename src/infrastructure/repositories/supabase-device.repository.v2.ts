import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { IDeviceRepository } from '../../domain/repositories/device.repository.interface'
import { Device } from '../../domain/entities/device'
import { DeviceStatus } from '../../domain/value-objects/device-status'

type DeviceRow = Database['public']['Tables']['devices']['Row']
type DeviceTypeRow = Database['public']['Tables']['device_types']['Row']

interface DeviceWithType extends DeviceRow {
  device_types?: DeviceTypeRow
}

/**
 * 실제 Supabase 데이터베이스와 연결되는 기기 리포지토리
 */
export class SupabaseDeviceRepositoryV2 implements IDeviceRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Device | null> {
    const { data, error } = await this.supabase
      .from('devices')
      .select(`
        *,
        device_types (*)
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data as DeviceWithType)
  }

  async findByNumber(deviceNumber: string): Promise<Device | null> {
    // deviceNumber는 "기종명 #번호" 형식이므로 파싱 필요
    const match = deviceNumber.match(/(.+)\s+#(\d+)/)
    if (!match) {
      return null
    }

    const [, typeName, number] = match
    
    const { data, error } = await this.supabase
      .from('devices')
      .select(`
        *,
        device_types!inner (*)
      `)
      .eq('device_number', parseInt(number))
      .eq('device_types.name', typeName)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data as DeviceWithType)
  }

  async findAll(): Promise<Device[]> {
    const { data, error } = await this.supabase
      .from('devices')
      .select(`
        *,
        device_types (*)
      `)
      .order('device_types.display_order')
      .order('device_number')

    if (error) {
      throw new Error(`Failed to find devices: ${error.message}`)
    }

    return (data || []).map(record => this.toDomain(record as DeviceWithType))
  }

  async findByStatus(status: DeviceStatus): Promise<Device[]> {
    const { data, error } = await this.supabase
      .from('devices')
      .select(`
        *,
        device_types (*)
      `)
      .eq('status', status.value)
      .order('device_types.display_order')
      .order('device_number')

    if (error) {
      throw new Error(`Failed to find devices by status: ${error.message}`)
    }

    return (data || []).map(record => this.toDomain(record as DeviceWithType))
  }

  async findByType(deviceType: string): Promise<Device[]> {
    const { data, error } = await this.supabase
      .from('devices')
      .select(`
        *,
        device_types!inner (*)
      `)
      .eq('device_types.name', deviceType)
      .order('device_number')

    if (error) {
      throw new Error(`Failed to find devices by type: ${error.message}`)
    }

    return (data || []).map(record => this.toDomain(record as DeviceWithType))
  }

  async isAvailable(deviceId: string): Promise<boolean> {
    const device = await this.findById(deviceId)
    if (!device) {
      return false
    }

    return device.status.value === 'available'
  }

  async save(device: Device): Promise<Device> {
    throw new Error('Device creation not supported through domain layer')
  }

  async update(device: Device): Promise<Device> {
    const { data, error } = await this.supabase
      .from('devices')
      .update({
        status: device.status.value,
        updated_at: device.updatedAt.toISOString()
      })
      .eq('id', device.id)
      .select(`
        *,
        device_types (*)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to update device: ${error.message}`)
    }

    return this.toDomain(data as DeviceWithType)
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

  private toDomain(record: DeviceWithType): Device {
    const deviceType = record.device_types
    const deviceName = deviceType 
      ? `${deviceType.name} #${record.device_number}`
      : `Device #${record.device_number}`

    return Device.create({
      id: record.id,
      name: deviceName,
      deviceType: deviceType?.name || 'Unknown',
      status: DeviceStatus.create(record.status as any),
      notes: record.notes || undefined,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at)
    })
  }
}