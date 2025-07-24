import { SupabaseClient } from '@supabase/supabase-js';
import { CheckInRepository } from '@/src/domain/repositories/checkin-repository.interface';
import { CheckIn, CheckInProps } from '@/src/domain/entities/checkin';
import { Database } from '@/src/types/supabase';
import { CheckInStatusType } from '@/src/domain/value-objects/checkin-status';

type CheckInRow = Database['public']['Tables']['check_ins']['Row'];
type CheckInInsert = Database['public']['Tables']['check_ins']['Insert'];
type CheckInUpdate = Database['public']['Tables']['check_ins']['Update'];

export class CheckInSupabaseRepository implements CheckInRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async create(checkIn: CheckIn): Promise<CheckIn> {
    const data = this.toSupabaseData(checkIn);
    
    const { data: created, error } = await this.supabase
      .from('check_ins')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`체크인 생성 실패: ${error.message}`);
    }

    return this.toDomainEntity(created);
  }

  async update(checkIn: CheckIn): Promise<CheckIn> {
    const data = this.toSupabaseData(checkIn);
    delete (data as any).id; // ID는 업데이트하지 않음
    
    const { data: updated, error } = await this.supabase
      .from('check_ins')
      .update(data as CheckInUpdate)
      .eq('id', checkIn.id)
      .select()
      .single();

    if (error) {
      throw new Error(`체크인 업데이트 실패: ${error.message}`);
    }

    return this.toDomainEntity(updated);
  }

  async findById(id: string): Promise<CheckIn | null> {
    const { data, error } = await this.supabase
      .from('check_ins')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return null;
      }
      throw new Error(`체크인 조회 실패: ${error.message}`);
    }

    return this.toDomainEntity(data);
  }

  async findByReservationId(reservationId: string): Promise<CheckIn | null> {
    const { data, error } = await this.supabase
      .from('check_ins')
      .select('*')
      .eq('reservation_id', reservationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return null;
      }
      throw new Error(`예약 ID로 체크인 조회 실패: ${error.message}`);
    }

    return this.toDomainEntity(data);
  }

  async findByDeviceId(deviceId: string): Promise<CheckIn[]> {
    const { data, error } = await this.supabase
      .from('check_ins')
      .select('*')
      .eq('device_id', deviceId)
      .order('check_in_time', { ascending: false });

    if (error) {
      throw new Error(`기기 ID로 체크인 조회 실패: ${error.message}`);
    }

    return data.map(row => this.toDomainEntity(row));
  }

  async findActiveCheckIns(): Promise<CheckIn[]> {
    const { data, error } = await this.supabase
      .from('check_ins')
      .select('*')
      .in('status', [CheckInStatusType.CHECKED_IN, CheckInStatusType.IN_USE])
      .order('check_in_time', { ascending: false });

    if (error) {
      throw new Error(`활성 체크인 조회 실패: ${error.message}`);
    }

    return data.map(row => this.toDomainEntity(row));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<CheckIn[]> {
    const { data, error } = await this.supabase
      .from('check_ins')
      .select('*')
      .gte('check_in_time', startDate.toISOString())
      .lte('check_in_time', endDate.toISOString())
      .order('check_in_time', { ascending: false });

    if (error) {
      throw new Error(`날짜 범위로 체크인 조회 실패: ${error.message}`);
    }

    return data.map(row => this.toDomainEntity(row));
  }

  async findActiveByDeviceId(deviceId: string): Promise<CheckIn | null> {
    const { data, error } = await this.supabase
      .from('check_ins')
      .select('*')
      .eq('device_id', deviceId)
      .in('status', [CheckInStatusType.CHECKED_IN, CheckInStatusType.IN_USE])
      .order('check_in_time', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return null;
      }
      throw new Error(`기기의 활성 체크인 조회 실패: ${error.message}`);
    }

    return this.toDomainEntity(data);
  }

  async findByStatus(status: string): Promise<CheckIn[]> {
    const { data, error } = await this.supabase
      .from('check_ins')
      .select('*')
      .eq('status', status)
      .order('check_in_time', { ascending: false });

    if (error) {
      throw new Error(`상태별 체크인 조회 실패: ${error.message}`);
    }

    return data.map(row => this.toDomainEntity(row));
  }

  async findPendingPayments(): Promise<CheckIn[]> {
    const { data, error } = await this.supabase
      .from('check_ins')
      .select('*')
      .eq('payment_status', 'pending')
      .eq('status', CheckInStatusType.CHECKED_IN)
      .order('check_in_time', { ascending: false });

    if (error) {
      throw new Error(`결제 대기 체크인 조회 실패: ${error.message}`);
    }

    return data.map(row => this.toDomainEntity(row));
  }

  /**
   * Supabase 데이터를 도메인 엔티티로 변환
   */
  private toDomainEntity(data: CheckInRow): CheckIn {
    const props: CheckInProps = {
      id: data.id,
      reservationId: data.reservation_id,
      deviceId: data.device_id,
      checkInTime: new Date(data.check_in_time),
      checkOutTime: data.check_out_time ? new Date(data.check_out_time) : undefined,
      paymentStatus: data.payment_status as any,
      paymentMethod: data.payment_method as any,
      paymentAmount: data.payment_amount,
      adjustedAmount: data.adjusted_amount ?? undefined,
      adjustmentReason: data.adjustment_reason ?? undefined,
      actualStartTime: data.actual_start_time ? new Date(data.actual_start_time) : undefined,
      actualEndTime: data.actual_end_time ? new Date(data.actual_end_time) : undefined,
      status: data.status as any,
      notes: data.notes ?? undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    return new CheckIn(props);
  }

  /**
   * 도메인 엔티티를 Supabase 데이터로 변환
   */
  private toSupabaseData(checkIn: CheckIn): CheckInInsert {
    const json = checkIn.toJSON();
    
    return {
      id: json.id,
      reservation_id: json.reservationId,
      device_id: json.deviceId,
      check_in_time: json.checkInTime.toISOString(),
      check_out_time: json.checkOutTime?.toISOString() ?? null,
      payment_status: json.paymentStatus,
      payment_method: json.paymentMethod ?? null,
      payment_amount: json.paymentAmount,
      adjusted_amount: json.adjustedAmount ?? null,
      adjustment_reason: json.adjustmentReason ?? null,
      actual_start_time: json.actualStartTime?.toISOString() ?? null,
      actual_end_time: json.actualEndTime?.toISOString() ?? null,
      status: json.status,
      notes: json.notes ?? null,
      created_at: json.createdAt.toISOString(),
      updated_at: json.updatedAt.toISOString()
    };
  }
}