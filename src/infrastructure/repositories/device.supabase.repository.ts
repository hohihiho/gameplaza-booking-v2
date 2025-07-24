import { Device, DeviceType, DeviceStatus } from '@/src/domain/entities/device.entity'
import { DeviceRepository } from '@/src/domain/repositories/device.repository.interface'
import { SupabaseClient } from '@supabase/supabase-js'

interface DeviceRow {
  id: string
  device_number: string
  name: string
  type: DeviceType
  status: DeviceStatus
  specifications: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export class DeviceSupabaseRepository implements DeviceRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: string): Promise<Device | null> {
    const { data, error } = await this.supabase
      .from('devices')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data as DeviceRow)
  }

  async findByDeviceNumber(deviceNumber: string): Promise<Device | null> {
    const { data, error } = await this.supabase
      .from('devices')
      .select('*')
      .eq('device_number', deviceNumber)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data as DeviceRow)
  }

  async findAll(): Promise<Device[]> {
    const { data, error } = await this.supabase
      .from('devices')
      .select('*')
      .order('device_number', { ascending: true })

    if (error || !data) {
      return []
    }

    return data.map((row: DeviceRow) => this.toDomain(row))
  }

  async findActive(): Promise<Device[]> {
    const { data, error } = await this.supabase
      .from('devices')
      .select('*')
      .eq('status', 'active')
      .order('device_number', { ascending: true })

    if (error || !data) {
      return []
    }

    return data.map((row: DeviceRow) => this.toDomain(row))
  }

  async save(device: Device): Promise<void> {
    const row = this.toRow(device)

    const { error } = await this.supabase
      .from('devices')
      .insert(row)

    if (error) {
      throw new Error(`Failed to save device: ${error.message}`)
    }
  }

  async update(device: Device): Promise<void> {
    const row = this.toRow(device)

    const { error } = await this.supabase
      .from('devices')
      .update(row)
      .eq('id', device.id)

    if (error) {
      throw new Error(`Failed to update device: ${error.message}`)
    }
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

  private toDomain(row: DeviceRow): Device {
    return Device.create({
      id: row.id,
      deviceNumber: row.device_number,
      name: row.name,
      type: row.type,
      status: row.status,
      specifications: row.specifications,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    })
  }

  private toRow(device: Device): DeviceRow {
    return {
      id: device.id,
      device_number: device.deviceNumber,
      name: device.name,
      type: device.type,
      status: device.status,
      specifications: device.specifications,
      notes: device.notes,
      created_at: device.createdAt.toISOString(),
      updated_at: device.updatedAt.toISOString()
    }
  }
}