import { CheckIn, CheckInStatus } from '@/src/domain/entities/check-in.entity'
import { CheckInRepository } from '@/src/domain/repositories/check-in.repository.interface'
import { KSTDateTime } from '@/src/domain/value-objects/kst-datetime'
import { SupabaseClient } from '@supabase/supabase-js'

interface CheckInRow {
  id: string
  reservation_id: string
  user_id: string
  device_id: string
  check_in_time: string
  check_out_time: string | null
  status: CheckInStatus
  check_in_by: string
  check_out_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export class CheckInSupabaseRepository implements CheckInRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: string): Promise<CheckIn | null> {
    const { data, error } = await this.supabase
      .from('check_ins')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data as CheckInRow)
  }

  async findByReservationId(reservationId: string): Promise<CheckIn | null> {
    const { data, error } = await this.supabase
      .from('check_ins')
      .select('*')
      .eq('reservation_id', reservationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data as CheckInRow)
  }

  async findActiveByUserId(userId: string): Promise<CheckIn[]> {
    const { data, error } = await this.supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'checked_in')
      .order('check_in_time', { ascending: false })

    if (error || !data) {
      return []
    }

    return data.map((row: CheckInRow) => this.toDomain(row))
  }

  async findActiveByDeviceId(deviceId: string): Promise<CheckIn | null> {
    const { data, error } = await this.supabase
      .from('check_ins')
      .select('*')
      .eq('device_id', deviceId)
      .eq('status', 'checked_in')
      .order('check_in_time', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data as CheckInRow)
  }

  async findByDateRange(startDate: KSTDateTime, endDate: KSTDateTime): Promise<CheckIn[]> {
    const { data, error } = await this.supabase
      .from('check_ins')
      .select('*')
      .gte('check_in_time', startDate.toISOString())
      .lte('check_in_time', endDate.toISOString())
      .order('check_in_time', { ascending: false })

    if (error || !data) {
      return []
    }

    return data.map((row: CheckInRow) => this.toDomain(row))
  }

  async save(checkIn: CheckIn): Promise<void> {
    const row = this.toRow(checkIn)

    const { error } = await this.supabase
      .from('check_ins')
      .insert(row)

    if (error) {
      throw new Error(`Failed to save check-in: ${error.message}`)
    }
  }

  async update(checkIn: CheckIn): Promise<void> {
    const row = this.toRow(checkIn)

    const { error } = await this.supabase
      .from('check_ins')
      .update({
        check_out_time: row.check_out_time,
        status: row.status,
        check_out_by: row.check_out_by,
        notes: row.notes,
        updated_at: row.updated_at
      })
      .eq('id', checkIn.id)

    if (error) {
      throw new Error(`Failed to update check-in: ${error.message}`)
    }
  }

  private toDomain(row: CheckInRow): CheckIn {
    return CheckIn.create({
      id: row.id,
      reservationId: row.reservation_id,
      userId: row.user_id,
      deviceId: row.device_id,
      checkInTime: KSTDateTime.create(new Date(row.check_in_time)),
      checkOutTime: row.check_out_time ? KSTDateTime.create(new Date(row.check_out_time)) : undefined,
      status: row.status,
      checkInBy: row.check_in_by,
      checkOutBy: row.check_out_by || undefined,
      notes: row.notes || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    })
  }

  private toRow(checkIn: CheckIn): CheckInRow {
    return {
      id: checkIn.id,
      reservation_id: checkIn.reservationId,
      user_id: checkIn.userId,
      device_id: checkIn.deviceId,
      check_in_time: checkIn.checkInTime.toISOString(),
      check_out_time: checkIn.checkOutTime ? checkIn.checkOutTime.toISOString() : null,
      status: checkIn.status,
      check_in_by: checkIn.checkInBy,
      check_out_by: checkIn.checkOutBy || null,
      notes: checkIn.notes || null,
      created_at: checkIn.createdAt.toISOString(),
      updated_at: checkIn.updatedAt.toISOString()
    }
  }
}