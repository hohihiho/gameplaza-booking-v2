import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { IReservationRepository } from '../../domain/repositories/reservation.repository.interface'
import { Reservation } from '../../domain/entities/reservation'
import { KSTDateTime } from '../../domain/value-objects/kst-datetime'
import { TimeSlot } from '../../domain/value-objects/time-slot'
import { ReservationStatus } from '../../domain/value-objects/reservation-status'
import { ReservationNumber } from '../../domain/value-objects/reservation-number'
import { CreditType } from '../../domain/value-objects/credit-type'

type ReservationRow = Database['public']['Tables']['reservations']['Row']
type ReservationInsert = Database['public']['Tables']['reservations']['Insert']

/**
 * 실제 Supabase 데이터베이스와 연결되는 예약 리포지토리
 * TDD 도메인 모델과 실제 DB 스키마를 매핑
 */
export class SupabaseReservationRepositoryV2 implements IReservationRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Reservation | null> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select(`
        *,
        devices!reservations_device_id_fkey (
          id,
          device_number,
          device_types (
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

    return this.toDomain(data)
  }

  async findByUserId(userId: string): Promise<Reservation[]> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select(`
        *,
        devices!reservations_device_id_fkey (
          id,
          device_number,
          device_types (
            id,
            name
          )
        )
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('start_time', { ascending: false })

    if (error) {
      throw new Error(`Failed to find reservations: ${error.message}`)
    }

    return (data || []).map(record => this.toDomain(record))
  }

  async findByDeviceId(deviceId: string): Promise<Reservation[]> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select(`
        *,
        devices!reservations_device_id_fkey (
          id,
          device_number,
          device_types (
            id,
            name
          )
        )
      `)
      .eq('device_id', deviceId)
      .order('date', { ascending: false })
      .order('start_time', { ascending: false })

    if (error) {
      throw new Error(`Failed to find reservations: ${error.message}`)
    }

    return (data || []).map(record => this.toDomain(record))
  }

  async findByDate(date: KSTDateTime): Promise<Reservation[]> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select(`
        *,
        devices!reservations_device_id_fkey (
          id,
          device_number,
          device_types (
            id,
            name
          )
        )
      `)
      .eq('date', date.dateString)
      .order('start_time', { ascending: true })

    if (error) {
      throw new Error(`Failed to find reservations: ${error.message}`)
    }

    return (data || []).map(record => this.toDomain(record))
  }

  async findActiveByUserId(userId: string): Promise<Reservation[]> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select(`
        *,
        devices!reservations_device_id_fkey (
          id,
          device_number,
          device_types (
            id,
            name
          )
        )
      `)
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
      .select(`
        *,
        devices!reservations_device_id_fkey (
          id,
          device_number,
          device_types (
            id,
            name
          )
        )
      `)
      .eq('device_id', deviceId)
      .eq('date', date.dateString)
      .in('status', ['pending', 'approved', 'checked_in'])

    if (error) {
      throw new Error(`Failed to find active reservations: ${error.message}`)
    }

    return (data || []).map(record => this.toDomain(record))
  }

  async save(reservation: Reservation): Promise<Reservation> {
    const record = await this.toRecord(reservation)
    
    const { data, error } = await this.supabase
      .from('reservations')
      .insert(record)
      .select(`
        *,
        devices!reservations_device_id_fkey (
          id,
          device_number,
          device_types (
            id,
            name
          )
        )
      `)
      .single()

    if (error) {
      throw new Error(`Failed to save reservation: ${error.message}`)
    }

    return this.toDomain(data)
  }

  async update(reservation: Reservation): Promise<Reservation> {
    const { data, error } = await this.supabase
      .from('reservations')
      .update({
        status: reservation.status.value,
        updated_at: reservation.updatedAt.toISOString()
      })
      .eq('id', reservation.id)
      .select(`
        *,
        devices!reservations_device_id_fkey (
          id,
          device_number,
          device_types (
            id,
            name
          )
        )
      `)
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

  async findByDeviceAndTimeRange(
    deviceId: string,
    startTime: KSTDateTime,
    endTime: KSTDateTime
  ): Promise<Reservation[]> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select(`
        *,
        devices!reservations_device_id_fkey (
          id,
          device_number,
          device_types (
            id,
            name
          )
        )
      `)
      .eq('device_id', deviceId)
      .gte('date', startTime.dateString)
      .lte('date', endTime.dateString)
      .in('status', ['pending', 'approved', 'checked_in'])

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
      .select(`
        *,
        devices!reservations_device_id_fkey (
          id,
          device_number,
          device_types (
            id,
            name
          )
        )
      `)
      .eq('user_id', userId)
      .gte('date', startTime.dateString)
      .lte('date', endTime.dateString)
      .in('status', ['pending', 'approved', 'checked_in'])

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
      .select(`
        *,
        devices!reservations_device_id_fkey (
          id,
          device_number,
          device_types (
            id,
            name
          )
        )
      `)
      .gte('date', startDate.dateString)
      .lte('date', endDate.dateString)

    if (error) {
      throw new Error(`Failed to find reservations by date range: ${error.message}`)
    }

    return (data || []).map(record => this.toDomain(record))
  }

  async countByDate(date: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('date', date)

    if (error) {
      throw new Error(`Failed to count reservations: ${error.message}`)
    }

    return count || 0
  }

  private toDomain(record: ReservationRow): Reservation {
    // 시간 문자열을 숫자로 변환 ("15:00:00" -> 15)
    let startHour = parseInt(record.start_time.split(':')[0])
    let endHour = parseInt(record.end_time.split(':')[0])
    
    // 밤샘 예약의 경우 0~5시를 24~29시로 변환
    // 시작시간이 0~5시이고 종료시간도 0~5시인 경우 (밤샘)
    if (startHour >= 0 && startHour <= 5 && endHour >= 0 && endHour <= 5) {
      startHour = startHour === 0 ? 24 : startHour + 24
      endHour = endHour + 24
    }
    // 시작시간이 22~23시이고 종료시간이 0~5시인 경우 (밤샘)
    else if (startHour >= 22 && startHour <= 23 && endHour >= 0 && endHour <= 5) {
      endHour = endHour + 24
    }
    
    // 기본 정보로 예약 생성
    const reservation = Reservation.create({
      id: record.id,
      userId: record.user_id,
      deviceId: record.device_id || '',
      date: KSTDateTime.fromString(record.date || '2025-01-01'),
      timeSlot: TimeSlot.create(startHour, endHour),
      status: ReservationStatus.create(record.status as any),
      reservationNumber: record.reservation_number || this.generateReservationNumber(record.date, record.id),
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at)
    })

    return reservation
  }

  private async toRecord(reservation: Reservation): Promise<ReservationInsert> {
    // 예약 번호 생성 (새로운 예약인 경우)
    let reservationNumber = reservation.reservationNumber
    if (!reservationNumber || reservationNumber === 'TEMP-001') {
      const count = await this.countByDate(reservation.date.dateString)
      reservationNumber = this.generateReservationNumber(reservation.date.dateString, count + 1)
    }

    return {
      id: reservation.id === 'temp-id' ? undefined : reservation.id,
      user_id: reservation.userId,
      device_id: reservation.deviceId,
      date: reservation.date.dateString,
      start_time: `${reservation.timeSlot.startHour.toString().padStart(2, '0')}:00`,
      end_time: `${reservation.timeSlot.endHour.toString().padStart(2, '0')}:00`,
      player_count: 1, // 기본값
      total_amount: null, // 기본값
      status: reservation.status.value,
      reservation_number: reservationNumber,
      user_notes: null, // 기본값
      credit_type: 'freeplay', // 기본값
      payment_method: 'cash', // 기본값
      payment_status: 'pending', // 기본값
      created_at: reservation.createdAt.toISOString(),
      updated_at: reservation.updatedAt.toISOString()
    }
  }

  private generateReservationNumber(date: string, sequence: number | string): string {
    const dateObj = new Date(date)
    const year = dateObj.getFullYear().toString().slice(-2)
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
    const day = dateObj.getDate().toString().padStart(2, '0')
    
    let seq: number
    if (typeof sequence === 'string') {
      // ID에서 시퀀스 추출 시도
      seq = parseInt(sequence.slice(-3)) || 1
    } else {
      seq = sequence
    }
    
    return `${year}${month}${day}-${seq.toString().padStart(3, '0')}`
  }
}