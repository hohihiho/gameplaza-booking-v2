// 예약 상태 자동 업데이트 서비스
// 크론잡 없이 조회 시점에 상태를 동적으로 처리

import { createAdminClient } from '@/lib/supabase';

export class ReservationStatusService {
  // 예약 목록 조회 시 상태 자동 업데이트
  static async getReservationsWithAutoUpdate() {
    const supabase = createAdminClient();
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // 1. 시간이 지난 예약들을 자동으로 완료 처리
    const { error: updateError } = await supabase
      .from('reservations')
      .update({ 
        status: 'completed',
        updated_at: now.toISOString()
      })
      .eq('status', 'approved')
      .or(`date.lt.${currentDate},and(date.eq.${currentDate},end_time.lt.${currentTime})`);

    if (updateError) {
      console.error('상태 자동 업데이트 실패:', updateError);
    }

    // 2. 체크인 시간이 지났는데 체크인 안 한 예약은 no_show 처리
    const checkInDeadline = new Date(now.getTime() - 30 * 60 * 1000); // 30분 전
    const deadlineTime = `${checkInDeadline.getHours().toString().padStart(2, '0')}:${checkInDeadline.getMinutes().toString().padStart(2, '0')}`;

    await supabase
      .from('reservations')
      .update({ 
        status: 'no_show',
        updated_at: now.toISOString()
      })
      .eq('status', 'approved')
      .eq('date', currentDate)
      .lt('start_time', deadlineTime);

    // 3. 업데이트된 예약 목록 반환
    const { data: reservations } = await supabase
      .from('reservations')
      .select('*')
      .order('date', { ascending: false })
      .order('start_time', { ascending: false });

    return reservations;
  }

  // 단일 예약 조회 시 상태 확인 및 업데이트
  static async checkAndUpdateReservationStatus(reservationId: string) {
    const supabase = createAdminClient();
    
    // 예약 조회
    const { data: reservation, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (error || !reservation) {
      return null;
    }

    const now = new Date();
    const reservationEndTime = new Date(`${reservation.date}T${reservation.end_time}`);
    
    // 종료 시간이 지났으면 자동 완료 처리
    if (reservation.status === 'approved' && reservationEndTime < now) {
      await supabase
        .from('reservations')
        .update({ 
          status: 'completed',
          updated_at: now.toISOString()
        })
        .eq('id', reservationId);

      return { ...reservation, status: 'completed' };
    }

    // 체크인 시간 30분 지났는데 체크인 안했으면 no_show
    const reservationStartTime = new Date(`${reservation.date}T${reservation.start_time}`);
    const checkInDeadline = new Date(reservationStartTime.getTime() + 30 * 60 * 1000);
    
    if (reservation.status === 'approved' && checkInDeadline < now) {
      await supabase
        .from('reservations')
        .update({ 
          status: 'no_show',
          updated_at: now.toISOString()
        })
        .eq('id', reservationId);

      return { ...reservation, status: 'no_show' };
    }

    return reservation;
  }
}