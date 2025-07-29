import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { BaseRepository } from './base.repository'

type Reservation = Database['public']['Tables']['reservations']['Row']
type ReservationInsert = Database['public']['Tables']['reservations']['Insert']
type ReservationUpdate = Database['public']['Tables']['reservations']['Update']

export interface ReservationWithDetails extends Reservation {
  devices?: {
    device_number: string
    status: string
    device_types?: {
      name: string
      model_name?: string
      version_name?: string
      category_id: string
      device_categories?: {
        name: string
      }
    }
  }
  users?: {
    name: string
    email: string
    phone?: string
  }
}

export class ReservationRepository extends BaseRepository<Reservation> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'reservations')
  }

  async findByUserId(userId: string, options?: {
    status?: string
    offset?: number
    limit?: number
  }): Promise<{ data: ReservationWithDetails[], count: number }> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        devices!inner(
          device_number,
          status,
          device_types(
            name,
            model_name,
            version_name,
            category_id,
            device_categories(
              name
            )
          )
        ),
        users!reservations_user_id_fkey(
          name,
          email,
          phone
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('start_time', { ascending: false })

    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status)
    }

    if (options?.offset !== undefined && options?.limit !== undefined) {
      query = query.range(options.offset, options.offset + options.limit - 1)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching reservations by user id:', error)
      throw error
    }

    return { data: data as ReservationWithDetails[], count: count || 0 }
  }

  async findByDateAndDevice(date: string, deviceId: string, statuses: string[]): Promise<Reservation[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('device_id', deviceId)
      .eq('date', date)
      .in('status', statuses)

    if (error) {
      console.error('Error fetching reservations by date and device:', error)
      throw error
    }

    return data as Reservation[]
  }

  async findActiveByUserId(userId: string): Promise<{ data: Reservation[], count: number }> {
    const { data, error, count } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .in('status', ['pending', 'approved'])

    if (error) {
      console.error('Error fetching active reservations:', error)
      throw error
    }

    return { data: data as Reservation[], count: count || 0 }
  }

  async countByDate(date: string): Promise<number> {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('date', date)

    if (error) {
      console.error('Error counting reservations by date:', error)
      throw error
    }

    return count || 0
  }

  async createWithDetails(reservation: ReservationInsert): Promise<ReservationWithDetails | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(reservation)
      .select(`
        *,
        devices!inner(
          device_number,
          status,
          device_types(
            name,
            category_id,
            device_categories(
              name
            )
          )
        )
      `)
      .single()

    if (error) {
      console.error('Error creating reservation:', error)
      throw error
    }

    return data as ReservationWithDetails
  }

  async updateStatus(id: string, status: string, adminNotes?: string): Promise<ReservationWithDetails | null> {
    const updateData: ReservationUpdate = {
      status,
      updated_at: new Date().toISOString()
    }

    if (adminNotes !== undefined) {
      updateData.admin_notes = adminNotes
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        devices!inner(
          device_number,
          status,
          device_types(
            name,
            model_name,
            version_name,
            category_id,
            device_categories(
              name
            )
          )
        ),
        users!reservations_user_id_fkey(
          name,
          email,
          phone
        )
      `)
      .single()

    if (error) {
      console.error('Error updating reservation status:', error)
      throw error
    }

    return data as ReservationWithDetails
  }

  async findUpcomingByDevice(deviceId: string, currentDate: string, currentTime: string): Promise<Reservation[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('device_id', deviceId)
      .in('status', ['approved', 'checked_in'])
      .or(`date.gt.${currentDate},and(date.eq.${currentDate},start_time.gte.${currentTime})`)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(10)

    if (error) {
      console.error('Error fetching upcoming reservations:', error)
      throw error
    }

    return data as Reservation[]
  }

  async findForAnalytics(startDate: string, endDate: string): Promise<ReservationWithDetails[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        devices!inner(
          device_number,
          device_types(
            name,
            category_id,
            device_categories(
              name
            )
          )
        ),
        users!reservations_user_id_fkey(
          name,
          email
        )
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .in('status', ['approved', 'checked_in', 'completed'])
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching reservations for analytics:', error)
      throw error
    }

    return data as ReservationWithDetails[]
  }
}