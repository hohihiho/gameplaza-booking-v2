/**
 * 예약 관련 비즈니스 로직을 처리하는 서비스 레이어
 */

import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';
import { 
  ReservationRequest, 
  ReservationResponse,
  ApiResponse 
} from '@/types/api';
import { 
  AppError, 
  ErrorCodes, 
  handleSupabaseError,
  createApiResponse 
} from '@/lib/utils/error-handler';
import { logger } from '@/lib/utils/logger';
import { formatKSTDate, parseKSTDate } from '@/lib/utils/kst-date';

type Reservation = Database['public']['Tables']['reservations']['Row'];
type ReservationInsert = Database['public']['Tables']['reservations']['Insert'];

export class ReservationService {
  private supabase = createClient();

  /**
   * 새 예약 생성
   */
  async createReservation(
    userId: string,
    data: ReservationRequest
  ): Promise<ApiResponse<ReservationResponse>> {
    try {
      logger.info('Creating reservation', { userId, data });

      // 1. 입력값 검증
      this.validateReservationInput(data);

      // 2. 시간대 가용성 확인
      const isAvailable = await this.checkTimeSlotAvailability(
        data.deviceId,
        data.date,
        data.timeSlot
      );

      if (!isAvailable) {
        throw new AppError(
          ErrorCodes.TIME_SLOT_UNAVAILABLE,
          '선택한 시간대는 이미 예약되었습니다.',
          409
        );
      }

      // 3. 예약 생성
      const reservation: ReservationInsert = {
        user_id: userId,
        device_id: data.deviceId,
        date: data.date,
        time_slot: data.timeSlot,
        purpose: data.purpose,
        participants: data.participants,
        status: 'active',
      };

      const { data: created, error } = await this.supabase
        .from('reservations')
        .insert(reservation)
        .select()
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      logger.info('Reservation created successfully', { reservationId: created.id });

      return createApiResponse(this.mapToResponse(created));
    } catch (error) {
      logger.error('Failed to create reservation', error);
      throw error;
    }
  }

  /**
   * 예약 취소
   */
  async cancelReservation(
    reservationId: string,
    userId: string
  ): Promise<ApiResponse<ReservationResponse>> {
    try {
      logger.info('Cancelling reservation', { reservationId, userId });

      // 1. 예약 확인 및 권한 체크
      const { data: reservation, error: fetchError } = await this.supabase
        .from('reservations')
        .select()
        .eq('id', reservationId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !reservation) {
        throw new AppError(
          ErrorCodes.RESERVATION_NOT_FOUND,
          '예약을 찾을 수 없습니다.',
          404
        );
      }

      if (reservation.status === 'cancelled') {
        throw new AppError(
          ErrorCodes.RESERVATION_CANCELLED,
          '이미 취소된 예약입니다.',
          400
        );
      }

      // 2. 예약 취소
      const { data: updated, error: updateError } = await this.supabase
        .from('reservations')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', reservationId)
        .select()
        .single();

      if (updateError) {
        throw handleSupabaseError(updateError);
      }

      logger.info('Reservation cancelled successfully', { reservationId });

      return createApiResponse(this.mapToResponse(updated));
    } catch (error) {
      logger.error('Failed to cancel reservation', error);
      throw error;
    }
  }

  /**
   * 사용자의 예약 목록 조회
   */
  async getUserReservations(
    userId: string,
    status?: 'active' | 'cancelled' | 'completed'
  ): Promise<ApiResponse<ReservationResponse[]>> {
    try {
      let query = this.supabase
        .from('reservations')
        .select(`
          *,
          devices (
            id,
            name,
            type,
            image
          )
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('time_slot', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw handleSupabaseError(error);
      }

      const reservations = data.map(this.mapToResponse);
      return createApiResponse(reservations);
    } catch (error) {
      logger.error('Failed to fetch user reservations', error);
      throw error;
    }
  }

  /**
   * 특정 날짜의 예약 가능한 시간대 조회
   */
  async getAvailableTimeSlots(
    deviceId: string,
    date: string
  ): Promise<ApiResponse<string[]>> {
    try {
      // 1. 해당 날짜의 모든 예약 조회
      const { data: reservations, error } = await this.supabase
        .from('reservations')
        .select('time_slot')
        .eq('device_id', deviceId)
        .eq('date', date)
        .eq('status', 'active');

      if (error) {
        throw handleSupabaseError(error);
      }

      // 2. 예약된 시간대 추출
      const bookedSlots = new Set(reservations.map(r => r.time_slot));

      // 3. 전체 시간대에서 예약된 시간대 제외
      const allTimeSlots = this.generateTimeSlots();
      const availableSlots = allTimeSlots.filter(slot => !bookedSlots.has(slot));

      return createApiResponse(availableSlots);
    } catch (error) {
      logger.error('Failed to fetch available time slots', error);
      throw error;
    }
  }

  /**
   * 입력값 검증
   */
  private validateReservationInput(data: ReservationRequest): void {
    if (!data.deviceId || !data.date || !data.timeSlot || !data.purpose) {
      throw new AppError(
        ErrorCodes.MISSING_REQUIRED_FIELD,
        '필수 항목을 모두 입력해주세요.',
        400
      );
    }

    if (data.participants < 1 || data.participants > 8) {
      throw new AppError(
        ErrorCodes.INVALID_INPUT,
        '참여 인원은 1명 이상 8명 이하여야 합니다.',
        400
      );
    }

    // 날짜 검증 (과거 날짜 예약 불가)
    const today = formatKSTDate(new Date());
    if (data.date < today) {
      throw new AppError(
        ErrorCodes.INVALID_INPUT,
        '과거 날짜는 예약할 수 없습니다.',
        400
      );
    }
  }

  /**
   * 시간대 가용성 확인
   */
  private async checkTimeSlotAvailability(
    deviceId: string,
    date: string,
    timeSlot: string
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select('id')
      .eq('device_id', deviceId)
      .eq('date', date)
      .eq('time_slot', timeSlot)
      .eq('status', 'active')
      .limit(1);

    if (error) {
      logger.error('Error checking time slot availability', error);
      return false;
    }

    return data.length === 0;
  }

  /**
   * 시간대 생성 (10:00 ~ 21:00)
   */
  private generateTimeSlots(): string[] {
    const slots: string[] = [];
    for (let hour = 10; hour <= 20; hour++) {
      slots.push(`${hour}:00`);
      if (hour < 20) {
        slots.push(`${hour}:30`);
      }
    }
    return slots;
  }

  /**
   * DB 모델을 API 응답 형식으로 변환
   */
  private mapToResponse(reservation: any): ReservationResponse {
    return {
      id: reservation.id,
      userId: reservation.user_id,
      deviceId: reservation.device_id,
      date: reservation.date,
      timeSlot: reservation.time_slot,
      purpose: reservation.purpose,
      participants: reservation.participants,
      status: reservation.status,
      createdAt: reservation.created_at,
      updatedAt: reservation.updated_at,
    };
  }
}

// 싱글톤 인스턴스 export
export const reservationService = new ReservationService();