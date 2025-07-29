import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { BaseRepository } from './base.repository'

type Device = Database['public']['Tables']['devices']['Row']

export interface DeviceWithType extends Device {
  device_types?: {
    id: string
    name: string
    model_name?: string
    version_name?: string
    category_id: string
    device_categories?: {
      id: string
      name: string
    }
  }
}

export class DeviceRepository extends BaseRepository<Device> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'devices')
  }

  async findAllWithTypes(): Promise<DeviceWithType[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        device_types(
          id,
          name,
          model_name,
          version_name,
          category_id,
          device_categories(
            id,
            name
          )
        )
      `)
      .order('device_number', { ascending: true })

    if (error) {
      console.error('Error fetching devices with types:', error)
      throw error
    }

    return data as DeviceWithType[]
  }

  async findByIdWithType(id: string): Promise<DeviceWithType | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        device_types(
          id,
          name,
          model_name,
          version_name,
          category_id,
          device_categories(
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching device by id:', error)
      return null
    }

    return data as DeviceWithType
  }

  async findByStatus(status: string): Promise<DeviceWithType[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        device_types(
          id,
          name,
          model_name,
          version_name,
          category_id,
          device_categories(
            id,
            name
          )
        )
      `)
      .eq('status', status)
      .order('device_number', { ascending: true })

    if (error) {
      console.error('Error fetching devices by status:', error)
      throw error
    }

    return data as DeviceWithType[]
  }

  async findByCategory(categoryId: string): Promise<DeviceWithType[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        device_types!inner(
          id,
          name,
          model_name,
          version_name,
          category_id,
          device_categories(
            id,
            name
          )
        )
      `)
      .eq('device_types.category_id', categoryId)
      .order('device_number', { ascending: true })

    if (error) {
      console.error('Error fetching devices by category:', error)
      throw error
    }

    return data as DeviceWithType[]
  }

  async updateStatus(id: string, status: string): Promise<Device | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating device status:', error)
      throw error
    }

    return data as Device
  }

  async findAvailableDevices(date: string, startTime: string, endTime: string): Promise<DeviceWithType[]> {
    // 먼저 모든 활성 기기 조회
    const { data: allDevices, error: devicesError } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        device_types(
          id,
          name,
          model_name,
          version_name,
          category_id,
          device_categories(
            id,
            name
          )
        )
      `)
      .eq('status', 'available')
      .order('device_number', { ascending: true })

    if (devicesError) {
      console.error('Error fetching devices:', devicesError)
      throw devicesError
    }

    // 해당 시간대의 예약 확인
    const { data: reservations, error: reservationsError } = await this.supabase
      .from('reservations')
      .select('device_id')
      .eq('date', date)
      .in('status', ['pending', 'approved', 'checked_in'])
      .lt('start_time', endTime)
      .gt('end_time', startTime)

    if (reservationsError) {
      console.error('Error fetching reservations:', reservationsError)
      throw reservationsError
    }

    const reservedDeviceIds = new Set(reservations?.map(r => r.device_id) || [])
    const availableDevices = allDevices?.filter(device => !reservedDeviceIds.has(device.id)) || []

    return availableDevices as DeviceWithType[]
  }

  async getDeviceStats(): Promise<{
    total: number
    available: number
    inUse: number
    maintenance: number
  }> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('status')

    if (error) {
      console.error('Error fetching device stats:', error)
      throw error
    }

    const stats = {
      total: data?.length || 0,
      available: 0,
      inUse: 0,
      maintenance: 0
    }

    data?.forEach(device => {
      switch (device.status) {
        case 'available':
          stats.available++
          break
        case 'in_use':
          stats.inUse++
          break
        case 'maintenance':
          stats.maintenance++
          break
      }
    })

    return stats
  }
}