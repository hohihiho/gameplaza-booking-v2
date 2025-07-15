import { supabaseAdmin } from '@/app/lib/supabase';

export class ScheduleService {
  /**
   * 조기영업 시간 계산 - 같은 날짜의 조기대여 중 가장 빠른 start_time
   */
  static async calculateEarlyOpenTime(date: string): Promise<string | null> {
    try {
      console.log(`조기영업 시간 계산 시작 - 날짜: ${date}`);
      
      // rental_time_slot_id가 없는 경우도 처리하기 위해 직접 시간대로 조회
      const { data: reservations, error } = await supabaseAdmin
        .from('reservations')
        .select('id, start_time')
        .eq('date', date)
        .eq('status', 'approved')
        .gte('start_time', '06:00:00')
        .lt('start_time', '12:00:00')
        .order('start_time', { ascending: true })
        .limit(1);

      console.log('조기영업 예약 조회 결과:', { count: reservations?.length, error });

      if (error || !reservations || reservations.length === 0) {
        return null;
      }

      console.log(`조기영업 가장 빠른 시간: ${reservations[0].start_time}`);
      return reservations[0].start_time;
    } catch (error) {
      console.error('조기영업 시간 계산 오류:', error);
      return null;
    }
  }

  /**
   * 밤샘영업 시간 계산 - 같은 날짜의 밤샘대여 중 가장 늦은 end_time
   */
  static async calculateOvernightCloseTime(date: string): Promise<string | null> {
    try {
      console.log(`밤샘영업 시간 계산 시작 - 날짜: ${date}`);
      
      // rental_time_slot_id가 없는 경우도 처리하기 위해 직접 시간대로 조회
      // 22시 이후 시작하거나 0-5시 사이 시작하는 예약
      const { data: reservations, error } = await supabaseAdmin
        .from('reservations')
        .select('id, start_time, end_time')
        .eq('date', date)
        .eq('status', 'approved')
        .or('start_time.gte.22:00:00,start_time.lt.06:00:00')
        .order('end_time', { ascending: false })
        .limit(1);

      console.log('밤샘영업 예약 조회 결과:', { count: reservations?.length, error });

      if (error || !reservations || reservations.length === 0) {
        return null;
      }

      console.log(`밤샘영업 가장 늦은 종료 시간: ${reservations[0].end_time}`);
      return reservations[0].end_time;
    } catch (error) {
      console.error('밤샘영업 시간 계산 오류:', error);
      return null;
    }
  }

  /**
   * 자동 스케줄 생성/업데이트
   */
  static async updateAutoSchedule(
    reservationId: string,
    date: string,
    slotType: 'early' | 'overnight'
  ): Promise<void> {
    try {
      console.log(`자동 스케줄 업데이트 시작 - 예약ID: ${reservationId}, 날짜: ${date}, 타입: ${slotType}`);
      
      let scheduleType: string;
      let startTime: string | null = null;
      let endTime: string | null = null;
      let title: string;

      if (slotType === 'early') {
        scheduleType = 'early_open';
        startTime = await this.calculateEarlyOpenTime(date);
        if (!startTime) {
          console.log('조기영업 시작 시간을 계산할 수 없습니다.');
          return;
        }
        
        title = '조기영업';
        // 조기영업의 경우 종료 시간은 일반 영업 시작 시간으로 설정 (기본값: 12:00)
        endTime = '12:00';
      } else {
        scheduleType = 'overnight';
        endTime = await this.calculateOvernightCloseTime(date);
        if (!endTime) {
          console.log('밤샘영업 종료 시간을 계산할 수 없습니다.');
          return;
        }
        
        title = '밤샘영업';
        // 밤샘영업의 경우 시작 시간은 일반 영업 종료 시간으로 설정 (기본값: 22:00)
        startTime = '22:00';
      }

      console.log(`스케줄 정보: ${title}, ${startTime} - ${endTime}`);

      // 기존 자동 생성 일정 확인
      const { data: existingSchedule } = await supabaseAdmin
        .from('schedule_events')
        .select('id')
        .eq('date', date)
        .eq('type', scheduleType)
        .eq('is_auto_generated', true)
        .single();

      console.log('기존 자동 생성 일정 확인 중...');
      
      if (existingSchedule) {
        console.log('기존 자동 생성 일정 발견, 업데이트 중...');
        // 기존 자동 생성 일정 업데이트
        const { error: updateError } = await supabaseAdmin
          .from('schedule_events')
          .update({
            start_time: startTime,
            end_time: endTime,
            source_reference: reservationId,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSchedule.id);
          
        if (updateError) {
          console.error('일정 업데이트 실패:', updateError);
          return;
        }
        console.log('기존 일정 업데이트 완료');
      } else {
        // 수동으로 생성된 일정이 있는지 확인
        const { data: manualSchedule } = await supabaseAdmin
          .from('schedule_events')
          .select('id')
          .eq('date', date)
          .eq('type', scheduleType)
          .eq('is_auto_generated', false)
          .single();

        // 수동 일정이 있으면 자동 생성하지 않음
        if (manualSchedule) {
          console.log(`${date}에 이미 수동으로 생성된 ${scheduleType} 일정이 있습니다.`);
          return;
        }

        console.log('새 자동 일정 생성 중...');
        // 새 자동 일정 생성
        const { error: insertError } = await supabaseAdmin
          .from('schedule_events')
          .insert({
            date,
            title,
            type: scheduleType,
            start_time: startTime,
            end_time: endTime,
            is_auto_generated: true,
            source_type: 'reservation_auto',
            source_reference: reservationId,
            affects_reservation: false,
            description: null
          });
          
        if (insertError) {
          console.error('일정 생성 실패:', insertError);
          return;
        }
        console.log('새 일정 생성 완료');
      }

      console.log(`${date} ${scheduleType} 일정이 자동으로 업데이트되었습니다.`);
    } catch (error) {
      console.error('자동 스케줄 업데이트 오류:', error);
      // 오류가 발생해도 예약 승인 프로세스는 계속 진행
    }
  }

  /**
   * 예약 승인 시 호출되는 메인 함수
   */
  static async handleReservationApproved(reservationId: string): Promise<void> {
    try {
      console.log('예약 승인 처리 시작:', reservationId);
      
      // 예약 정보 조회 (start_time 포함)
      const { data: reservation, error } = await supabaseAdmin
        .from('reservations')
        .select('id, date, start_time, end_time')
        .eq('id', reservationId)
        .single();

      if (error || !reservation) {
        console.error('예약 정보 조회 실패:', error);
        return;
      }
      
      console.log('예약 정보:', reservation);

      let slotType: 'early' | 'overnight' | null = null;
      
      // 시간대로 판단
      if (reservation.start_time) {
        const startHour = parseInt(reservation.start_time.split(':')[0]);
        
        // 6시-12시 사이 시작은 조기영업
        if (startHour >= 6 && startHour < 12) {
          slotType = 'early';
        }
        // 22시 이후 또는 0시-5시 시작은 밤샘영업
        else if (startHour >= 22 || startHour < 6) {
          slotType = 'overnight';
        }
      }

      console.log('시간대 타입:', slotType);
      
      // 조기대여 또는 밤샘대여인 경우에만 자동 스케줄 업데이트
      if (slotType === 'early' || slotType === 'overnight') {
        console.log(`${slotType} 예약 승인됨, 자동 스케줄 업데이트 시작`);
        await this.updateAutoSchedule(
          reservationId,
          reservation.date,
          slotType
        );
      } else {
        console.log(`일반 예약이므로 자동 스케줄 생성하지 않음`);
      }
    } catch (error) {
      console.error('예약 승인 처리 중 오류:', error);
    }
  }
}