import { SupabaseClient } from '@supabase/supabase-js'
import { IReservationRepository, ReservationFilterOptions, ReservationListResult } from '../../domain/repositories/reservation.repository.interface'
import { Reservation } from '../../domain/entities/reservation'
import { KSTDateTime } from '../../domain/value-objects/kst-datetime'
import { TimeSlot } from '../../domain/value-objects/time-slot'
import { ReservationStatus } from '../../domain/value-objects/reservation-status'

interface ReservationRecord {
  id: string
  user_id: string
  device_id: string
  date: string
  time_slot: string
  status: string
  reservation_number: string
  created_at: string
  updated_at: string
}

export class SupabaseReservationRepository implements IReservationRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: string): Promise<Reservation | null> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data)
  }

  async findByUserId(userId: string, options?: ReservationFilterOptions): Promise<ReservationListResult> {
    let query = this.supabase
      .from('reservations')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    // 상태 필터
    if (options?.status && options.status.length > 0) {
      query = query.in('status', options.status)
    }

    // 날짜 범위 필터
    if (options?.dateFrom) {
      query = query.gte('date', options.dateFrom.toISOString().split('T')[0])
    }
    if (options?.dateTo) {
      query = query.lte('date', options.dateTo.toISOString().split('T')[0])
    }

    // 페이징
    const page = options?.page || 1
    const pageSize = options?.pageSize || 10
    const offset = (page - 1) * pageSize
    query = query.range(offset, offset + pageSize - 1)

    query = query.order('date', { ascending: false })
      .order('time_slot', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to find reservations: ${error.message}`)
    }

    return {
      reservations: (data || []).map(record => this.toDomain(record)),
      totalCount: count || 0
    }
  }

  async findByDeviceId(deviceId: string): Promise<Reservation[]> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select('*')
      .eq('device_id', deviceId)
      .order('date', { ascending: false })
      .order('time_slot', { ascending: false })

    if (error) {
      throw new Error(`Failed to find reservations: ${error.message}`)
    }

    return (data || []).map(record => this.toDomain(record))
  }

  async findByDate(date: KSTDateTime): Promise<Reservation[]> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select('*')
      .eq('date', date.dateString)
      .order('time_slot', { ascending: true })

    if (error) {
      throw new Error(`Failed to find reservations: ${error.message}`)
    }

    return (data || []).map(record => this.toDomain(record))
  }

  async findActiveByUserId(userId: string): Promise<Reservation[]> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'approved', 'checked_in'])

    if (error) {
      throw new Error(`Failed to find active reservations: ${error.message}`)
    }

    return (data || []).map(record => this.toDomain(record))
  }

  async findActiveByDeviceIdAndDate(
    deviceId: string,
    date: KSTDateTime
  ): Promise<Reservation[]> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select('*')
      .eq('device_id', deviceId)
      .eq('date', date.dateString)
      .in('status', ['pending', 'approved', 'checked_in'])

    if (error) {
      throw new Error(`Failed to find active reservations: ${error.message}`)
    }

    return (data || []).map(record => this.toDomain(record))
  }

  async save(reservation: Reservation): Promise<Reservation> {
    const record = this.toRecord(reservation)
    
    const { data, error } = await this.supabase
      .from('reservations')
      .insert(record)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save reservation: ${error.message}`)
    }

    return this.toDomain(data)
  }

  async update(reservation: Reservation): Promise<Reservation> {
    const record = this.toRecord(reservation)
    
    const { data, error } = await this.supabase
      .from('reservations')
      .update({
        status: record.status,
        updated_at: record.updated_at
      })
      .eq('id', reservation.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update reservation: ${error.message}`)
    }

    return this.toDomain(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('reservations')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete reservation: ${error.message}`)
    }
  }

  private toDomain(record: ReservationRecord): Reservation {
    return Reservation.create({
      id: record.id,
      userId: record.user_id,
      deviceId: record.device_id,
      date: KSTDateTime.fromString(record.date),
      timeSlot: TimeSlot.fromString(record.time_slot),
      status: ReservationStatus.create(record.status as any),
      reservationNumber: record.reservation_number,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at)
    })
  }

  async findByDeviceAndTimeRange(
    deviceId: string,
    startTime: KSTDateTime,
    endTime: KSTDateTime
  ): Promise<Reservation[]> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select('*')
      .eq('device_id', deviceId)
      .gte('date', startTime.dateString)
      .lte('date', endTime.dateString)

    if (error) {
      throw new Error(`Failed to find reservations by device and time range: ${error.message}`)
    }

    return (data || []).map(record => this.toDomain(record))
  }

  async findByUserAndTimeRange(
    userId: string,
    startTime: KSTDateTime,
    endTime: KSTDateTime
  ): Promise<Reservation[]> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startTime.dateString)
      .lte('date', endTime.dateString)

    if (error) {
      throw new Error(`Failed to find reservations by user and time range: ${error.message}`)
    }

    return (data || []).map(record => this.toDomain(record))
  }

  async findByDateRange(
    startDate: KSTDateTime,
    endDate: KSTDateTime
  ): Promise<Reservation[]> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select('*')
      .gte('date', startDate.dateString)
      .lte('date', endDate.dateString)

    if (error) {
      throw new Error(`Failed to find reservations by date range: ${error.message}`)
    }

    return (data || []).map(record => this.toDomain(record))
  }

  async findByDeviceAndTimeSlot(
    deviceId: string,
    date: KSTDateTime,
    timeSlot: TimeSlot
  ): Promise<Reservation[]> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select('*')
      .eq('device_id', deviceId)
      .eq('date', date.dateString)
      .eq('time_slot', timeSlot.displayString)

    if (error) {
      throw new Error(`Failed to find reservations by device and time slot: ${error.message}`)
    }

    return (data || []).map(record => this.toDomain(record))
  }

  async findActiveByDeviceId(deviceId: string): Promise<Reservation[]> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select('*')
      .eq('device_id', deviceId)
      .in('status', ['pending', 'approved', 'checked_in'])

    if (error) {
      throw new Error(`Failed to find active reservations by device: ${error.message}`)
    }

    return (data || []).map(record => this.toDomain(record))
  }

  async findFutureByDeviceId(deviceId: string): Promise<Reservation[]> {
    const today = KSTDateTime.now().dateString
    const { data, error } = await this.supabase
      .from('reservations')
      .select('*')
      .eq('device_id', deviceId)
      .gte('date', today)
      .in('status', ['pending', 'approved'])

    if (error) {
      throw new Error(`Failed to find future reservations by device: ${error.message}`)
    }

    return (data || []).map(record => this.toDomain(record))
  }

  private toRecord(reservation: Reservation): ReservationRecord {
    return {
      id: reservation.id,
      user_id: reservation.userId,
      device_id: reservation.deviceId,
      date: reservation.date.dateString,
      time_slot: reservation.timeSlot.displayString,
      status: reservation.status.value,
      reservation_number: reservation.reservationNumber,
      created_at: reservation.createdAt.toISOString(),
      updated_at: reservation.updatedAt.toISOString()
    }
  }
}