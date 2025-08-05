import { createAdminClient } from '@/lib/supabase';

export class ScheduleService {
  /**
   * 주중인지 확인 (일요일-목요일)
   * 금요일, 토요일은 주말로 간주
   */
  static isWeekday(dateString: string): boolean {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay(); // 0 = 일요일, 6 = 토요일
    
    // 금요일(5) 또는 토요일(6)이면 false 반환 (주말)
    // 일요일(0) ~ 목요일(4)이면 true 반환 (주중)
    return dayOfWeek !== 5 && dayOfWeek !== 6;
  }
  /**
   * 조기영업 시간 계산 - 7시 예약이 있으면 7시, 없으면 8시 기본값
   */
  static async calculateEarlyOpenTime(date: string): Promise<string | null> {
    try {
      console.log(`조기영업 시간 계산 시작 - 날짜: ${date}`);
      
      // rental_time_slot_id가 없는 경우도 처리하기 위해 직접 시간대로 조회
      const supabaseAdmin = createAdminClient();
      
      // 먼저 7시 예약이 있는지 확인
      const { data: sevenAmReservations, error: sevenAmError } = await supabaseAdmin
        .from('reservations')
        .select('id')
        .eq('date', date)
        .eq('status', 'approved')
        .eq('start_time', '07:00:00')
        .limit(1);

      if (sevenAmError) {
        console.error('7시 예약 조회 오류:', sevenAmError);
        return '08:00:00'; // 오류 시 기본값 8시
      }

      // 7시 예약이 있으면 7시 반환
      if (sevenAmReservations && sevenAmReservations.length > 0) {
        console.log('7시 조기예약 발견 - 조기영업 시간: 07:00');
        return '07:00:00';
      }

      // 7시 예약이 없으면 다른 조기예약이 있는지 확인
      const { data: earlyReservations, error } = await supabaseAdmin
        .from('reservations')
        .select('id')
        .eq('date', date)
        .eq('status', 'approved')
        .gte('start_time', '07:00:00')
        .lte('start_time', '14:00:00')
        .limit(1);

      if (error) {
        console.error('조기예약 조회 오류:', error);
        return '08:00:00'; // 오류 시 기본값 8시
      }

      // 조기예약이 있으면 8시 반환 (7시가 아닌 경우)
      if (earlyReservations && earlyReservations.length > 0) {
        console.log('조기예약 발견 - 조기영업 시간: 08:00 (기본값)');
        return '08:00:00';
      }

      // 조기예약이 없으면 null 반환
      console.log('조기예약 없음');
      return null;
    } catch (error) {
      console.error('조기영업 시간 계산 오류:', error);
      return '08:00:00'; // 오류 시 기본값 8시
    }
  }

  /**
   * 밤샘영업 시간 계산 - 해당 예약의 종료시간을 그대로 사용
   */
  static async calculateOvernightCloseTime(reservationId: string): Promise<string | null> {
    try {
      console.log(`밤샘영업 시간 계산 시작 - 예약ID: ${reservationId}`);
      
      const supabaseAdmin = createAdminClient();
      const { data: reservation, error } = await supabaseAdmin
        .from('reservations')
        .select('end_time')
        .eq('id', reservationId)
        .single();

      console.log('밤샘영업 예약 조회 결과:', { reservation, error });

      if (error || !reservation || !reservation.end_time) {
        return null;
      }

      console.log(`밤샘영업 종료 시간: ${reservation.end_time}`);
      return reservation.end_time;
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
        // 조기영업의 경우 종료 시간은 null (시작 시간만 표시)
        endTime = null;
      } else {
        scheduleType = 'overnight';
        // 밤샘영업은 항상 29시(05:00)에 종료
        endTime = '05:00:00';
        
        title = '밤샘영업';
        // 밤샘영업의 경우 시작 시간은 null (종료 시간만 표시)
        startTime = null;
      }

      console.log(`스케줄 정보: ${title}, ${startTime} - ${endTime}`);

      // 기존 자동 생성 일정 확인
      const supabaseAdmin = createAdminClient();
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
   * 자동 생성된 스케줄 삭제 (해당 시간대 예약이 모두 없어졌을 때)
   */
  static async checkAndDeleteAutoSchedules(date: string): Promise<void> {
    try {
      console.log(`자동 스케줄 삭제 검사 시작 - 날짜: ${date}`);
      
      // 해당 날짜의 활성 예약 조회 (pending, approved, checked_in)
      const supabaseAdmin = createAdminClient();
      const { data: activeReservations, error: reservationError } = await supabaseAdmin
        .from('reservations')
        .select('id, start_time, end_time')
        .eq('date', date)
        .in('status', ['pending', 'approved', 'checked_in']);

      if (reservationError) {
        console.error('활성 예약 조회 실패:', reservationError);
        return;
      }

      const reservations = activeReservations || [];
      console.log(`활성 예약 개수: ${reservations.length}`);

      // 조기영업 시간대 예약 확인 (07:00-14:00)
      const earlyReservations = reservations.filter(r => {
        if (!r.start_time) return false;
        const startHour = parseInt(r.start_time.split(':')[0]);
        return startHour >= 7 && startHour <= 14;
      });

      // 밤샘영업 시간대 예약 확인 (00:00-05:59, 22:00-23:59)
      const overnightReservations = reservations.filter(r => {
        if (!r.start_time) return false;
        const startHour = parseInt(r.start_time.split(':')[0]);
        return startHour >= 22 || startHour <= 5;
      });

      console.log(`조기영업 예약: ${earlyReservations.length}개, 밤샘영업 예약: ${overnightReservations.length}개`);

      // 조기영업 스케줄 삭제 검사
      if (earlyReservations.length === 0) {
        const { data: earlySchedules } = await supabaseAdmin
          .from('schedule_events')
          .select('id')
          .eq('date', date)
          .eq('type', 'early_open')
          .eq('is_auto_generated', true);

        if (earlySchedules && earlySchedules.length > 0) {
          console.log('조기영업 자동 스케줄 삭제 중...');
          const { error: deleteError } = await supabaseAdmin
            .from('schedule_events')
            .delete()
            .eq('date', date)
            .eq('type', 'early_open')
            .eq('is_auto_generated', true);

          if (deleteError) {
            console.error('조기영업 스케줄 삭제 실패:', deleteError);
          } else {
            console.log(`${date} 조기영업 자동 스케줄 삭제 완료`);
          }
        }
      }

      // 밤샘영업 스케줄 삭제 검사
      if (overnightReservations.length === 0) {
        const { data: overnightSchedules } = await supabaseAdmin
          .from('schedule_events')
          .select('id')
          .eq('date', date)
          .eq('type', 'overnight')
          .eq('is_auto_generated', true);

        if (overnightSchedules && overnightSchedules.length > 0) {
          console.log('밤샘영업 자동 스케줄 삭제 중...');
          const { error: deleteError } = await supabaseAdmin
            .from('schedule_events')
            .delete()
            .eq('date', date)
            .eq('type', 'overnight')
            .eq('is_auto_generated', true);

          if (deleteError) {
            console.error('밤샘영업 스케줄 삭제 실패:', deleteError);
          } else {
            console.log(`${date} 밤샘영업 자동 스케줄 삭제 완료`);
          }
        }
      }

    } catch (error) {
      console.error('자동 스케줄 삭제 검사 중 오류:', error);
    }
  }

  /**
   * 주말 밤샘영업 3주치 자동 생성
   * 금요일 → 토요일, 토요일 → 일요일 밤샘영업 생성
   */
  static async generateWeekendOvernightSchedules(): Promise<{ created: number; skipped: number }> {
    try {
      console.log('주말 밤샘영업 3주치 자동 생성 시작');
      
      const supabaseAdmin = createAdminClient();
      const today = new Date();
      let created = 0;
      let skipped = 0;
      
      // 3주치 생성
      for (let week = 0; week < 3; week++) {
        // 이번 주 또는 다음 주의 금요일 찾기
        const daysUntilFriday = (5 - today.getDay() + 7) % 7;
        const friday = new Date(today);
        friday.setDate(today.getDate() + daysUntilFriday + (week * 7));
        
        // 토요일 = 금요일 + 1일
        const saturday = new Date(friday);
        saturday.setDate(friday.getDate() + 1);
        
        // 날짜 문자열 생성 (YYYY-MM-DD 형식) - 로컬 시간 기준
        const fridayStr = `${friday.getFullYear()}-${String(friday.getMonth() + 1).padStart(2, '0')}-${String(friday.getDate()).padStart(2, '0')}`;
        const saturdayStr = `${saturday.getFullYear()}-${String(saturday.getMonth() + 1).padStart(2, '0')}-${String(saturday.getDate()).padStart(2, '0')}`;
        
        console.log(`주말 ${week + 1}주차: 금요일 ${fridayStr}, 토요일 ${saturdayStr}`);
        
        // 금요일 밤샘영업 (금→토) 생성
        const fridayResult = await this.createWeekendOvernightSchedule(fridayStr, '밤샘영업');
        if (fridayResult) {
          created++;
        } else {
          skipped++;
        }
        
        // 토요일 밤샘영업 (토→일) 생성
        const saturdayResult = await this.createWeekendOvernightSchedule(saturdayStr, '밤샘영업');
        if (saturdayResult) {
          created++;
        } else {
          skipped++;
        }
      }
      
      console.log(`주말 밤샘영업 생성 완료 - 생성: ${created}개, 건너뜀: ${skipped}개`);
      return { created, skipped };
      
    } catch (error) {
      console.error('주말 밤샘영업 자동 생성 오류:', error);
      throw error;
    }
  }
  
  /**
   * 개별 주말 밤샘영업 스케줄 생성
   */
  private static async createWeekendOvernightSchedule(date: string, title: string): Promise<boolean> {
    try {
      const supabaseAdmin = createAdminClient();
      
      // 이미 해당 날짜에 밤샘영업 스케줄이 있는지 확인
      const { data: existing } = await supabaseAdmin
        .from('schedule_events')
        .select('id')
        .eq('date', date)
        .eq('type', 'overnight')
        .single();
      
      if (existing) {
        console.log(`${date}에 이미 밤샘영업 스케줄이 존재합니다.`);
        return false;
      }
      
      // 새 밤샘영업 스케줄 생성
      const { error } = await supabaseAdmin
        .from('schedule_events')
        .insert({
          date,
          title,
          type: 'overnight',
          start_time: null,  // 밤샘영업은 종료시간만 표시
          end_time: '05:00:00',  // 고정 29시(05:00)
          is_auto_generated: true,
          source_type: 'manual',
          source_reference: null,
          affects_reservation: false,
          description: '주말 정기 밤샘영업'
        });
      
      if (error) {
        console.error(`${date} 밤샘영업 스케줄 생성 실패:`, error);
        return false;
      }
      
      console.log(`${date} 밤샘영업 스케줄 생성 완료`);
      return true;
      
    } catch (error) {
      console.error('밤샘영업 스케줄 생성 중 오류:', error);
      return false;
    }
  }

  /**
   * 예약 승인 시 호출되는 메인 함수
   */
  static async handleReservationApproved(reservationId: string): Promise<void> {
    try {
      console.log('예약 승인 처리 시작:', reservationId);
      
      // 예약 정보 조회 (start_time 포함)
      const supabaseAdmin = createAdminClient();
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
        
        // 7시-14시 사이 시작은 조기영업
        if (startHour >= 7 && startHour <= 14) {
          slotType = 'early';
        }
        // 22시 이후 또는 0시-5시 시작은 밤샘영업
        else if (startHour >= 22 || startHour < 6) {
          slotType = 'overnight';
        }
      }

      console.log('시간대 타입:', slotType);
      
      // 조기대여 또는 밤샘대여인 경우 자동 스케줄 업데이트
      if (slotType === 'early') {
        // 조기영업은 주중/주말 상관없이 생성
        console.log(`조기예약 승인됨, 자동 스케줄 업데이트 시작`);
        await this.updateAutoSchedule(
          reservationId,
          reservation.date,
          slotType
        );
      } else if (slotType === 'overnight' && this.isWeekday(reservation.date)) {
        // 밤샘영업은 주중(일-목)에만 생성
        console.log(`밤샘예약 승인됨 (주중), 자동 스케줄 업데이트 시작`);
        await this.updateAutoSchedule(
          reservationId,
          reservation.date,
          slotType
        );
      } else if (slotType === 'overnight' && !this.isWeekday(reservation.date)) {
        console.log(`밤샘예약이지만 주말(금/토)이므로 자동 스케줄 생성하지 않음`);
      } else {
        console.log(`일반 예약이므로 자동 스케줄 생성하지 않음`);
      }
    } catch (error) {
      console.error('예약 승인 처리 중 오류:', error);
    }
  }
}