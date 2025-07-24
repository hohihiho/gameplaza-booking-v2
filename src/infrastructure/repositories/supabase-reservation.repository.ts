import { SupabaseClient } from '@supabase/supabase-js'
import { IReservationRepository } from '../../domain/repositories/reservation.repository.interface'
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

  async findByUserId(userId: string): Promise<Reservation[]> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('time_slot', { ascending: false })

    if (error) {
      throw new Error(`Failed to find reservations: ${error.message}`)
    }

    return (data || []).map(record => this.toDomain(record))
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