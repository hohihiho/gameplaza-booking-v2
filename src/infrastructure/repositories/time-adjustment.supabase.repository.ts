import { TimeAdjustment, TimeAdjustmentReason } from '@/src/domain/value-objects/time-adjustment'
import { ITimeAdjustmentRepository } from '@/src/domain/repositories/time-adjustment.repository.interface'
import { SupabaseClient } from '@supabase/supabase-js'

interface TimeAdjustmentRow {
  id: string
  reservation_id: string
  original_start_time: string
  original_end_time: string
  actual_start_time: string
  actual_end_time: string
  reason: TimeAdjustmentReason
  reason_detail: string | null
  adjusted_by: string
  adjusted_at: string
  created_at: string
  updated_at: string
}

export class TimeAdjustmentSupabaseRepository implements ITimeAdjustmentRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(reservationId: string, timeAdjustment: TimeAdjustment): Promise<void> {
    const { error } = await this.supabase
      .from('time_adjustments')
      .insert({
        reservation_id: reservationId,
        original_start_time: timeAdjustment.originalStartTime.toISOString(),
        original_end_time: timeAdjustment.originalEndTime.toISOString(),
        actual_start_time: timeAdjustment.actualStartTime.toISOString(),
        actual_end_time: timeAdjustment.actualEndTime.toISOString(),
        reason: timeAdjustment.reason,
        reason_detail: timeAdjustment.reasonDetail,
        adjusted_by: timeAdjustment.adjustedBy,
        adjusted_at: timeAdjustment.adjustedAt.toISOString()
      })

    if (error) {
      throw new Error(`시간 조정 이력 저장 실패: ${error.message}`)
    }
  }

  async findById(id: string): Promise<TimeAdjustment | null> {
    const { data, error } = await this.supabase
      .from('time_adjustments')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data as TimeAdjustmentRow)
  }

  async findByReservationId(reservationId: string): Promise<TimeAdjustment[]> {
    const { data, error } = await this.supabase
      .from('time_adjustments')
      .select('*')
      .eq('reservation_id', reservationId)
      .order('adjusted_at', { ascending: false })

    if (error) {
      throw new Error(`시간 조정 이력 조회 실패: ${error.message}`)
    }

    return (data || []).map(row => this.toDomain(row as TimeAdjustmentRow))
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<TimeAdjustment[]> {
    const { data, error } = await this.supabase
      .from('time_adjustments')
      .select('*')
      .gte('adjusted_at', startDate.toISOString())
      .lte('adjusted_at', endDate.toISOString())
      .order('adjusted_at', { ascending: false })

    if (error) {
      throw new Error(`시간 조정 이력 조회 실패: ${error.message}`)
    }

    return (data || []).map(row => this.toDomain(row as TimeAdjustmentRow))
  }

  async findByAdjustedBy(userId: string): Promise<TimeAdjustment[]> {
    const { data, error } = await this.supabase
      .from('time_adjustments')
      .select('*')
      .eq('adjusted_by', userId)
      .order('adjusted_at', { ascending: false })

    if (error) {
      throw new Error(`시간 조정 이력 조회 실패: ${error.message}`)
    }

    return (data || []).map(row => this.toDomain(row as TimeAdjustmentRow))
  }

  private toDomain(row: TimeAdjustmentRow): TimeAdjustment {
    return TimeAdjustment.create({
      originalStartTime: new Date(row.original_start_time),
      originalEndTime: new Date(row.original_end_time),
      actualStartTime: new Date(row.actual_start_time),
      actualEndTime: new Date(row.actual_end_time),
      reason: row.reason,
      reasonDetail: row.reason_detail || undefined,
      adjustedBy: row.adjusted_by,
      adjustedAt: new Date(row.adjusted_at)
    })
  }
}