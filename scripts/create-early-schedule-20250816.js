const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createEarlySchedule() {
  try {
    console.log('8월 16일 조기영업 스케줄 생성 시작...');
    
    // 1. 8월 16일 승인된 예약만 확인
    const { data: reservations, error: reservationError } = await supabase
      .from('reservations')
      .select('*')
      .eq('date', '2025-08-16')
      .eq('status', 'approved')  // 승인된 예약만
      .order('start_time');
    
    if (reservationError) {
      console.error('예약 조회 실패:', reservationError);
      return;
    }
    
    console.log(`8월 16일 승인된 예약 ${reservations.length}건 발견`);
    console.log('예약 목록:', reservations.map(r => ({
      id: r.id,
      status: r.status,
      start_time: r.start_time,
      end_time: r.end_time
    })));
    
    // 조기영업 예약 찾기 (7시-14시 시작)
    const earlyReservations = reservations.filter(r => {
      if (!r.start_time) return false;
      const hour = parseInt(r.start_time.split(':')[0]);
      return hour >= 7 && hour <= 14;
    });
    
    if (earlyReservations.length === 0) {
      console.log('조기영업 예약이 없습니다.');
      return;
    }
    
    console.log(`조기영업 예약 ${earlyReservations.length}건 발견`);
    
    // 가장 빠른 시작 시간 찾기
    const earliestTime = earlyReservations.reduce((min, r) => {
      return r.start_time < min ? r.start_time : min;
    }, '23:59:59');
    
    console.log(`가장 빠른 조기영업 시작 시간: ${earliestTime}`);
    
    // 2. 기존 조기영업 스케줄 확인
    const { data: existingSchedule, error: selectError } = await supabase
      .from('schedule_events')
      .select('*')
      .eq('date', '2025-08-16')
      .eq('type', 'early_open')
      .single();
    
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('스케줄 조회 에러:', selectError);
    }
    
    if (existingSchedule) {
      console.log('이미 조기영업 스케줄이 존재합니다:', existingSchedule);
      
      // 시작 시간 업데이트가 필요한지 확인
      if (existingSchedule.start_time !== earliestTime) {
        const { error: updateError } = await supabase
          .from('schedule_events')
          .update({ 
            start_time: earliestTime,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSchedule.id);
        
        if (updateError) {
          console.error('스케줄 업데이트 실패:', updateError);
        } else {
          console.log(`조기영업 시작 시간을 ${earliestTime}로 업데이트했습니다.`);
        }
      }
    } else {
      // 3. 새로운 조기영업 스케줄 생성
      const newSchedule = {
        date: '2025-08-16',
        type: 'early_open',
        title: '조기영업',
        description: `조기대여 예약으로 인한 자동 생성`,
        start_time: earliestTime,
        end_time: null,
        is_auto_generated: true,
        source_type: 'reservation_auto',
        created_at: new Date().toISOString()
      };
      
      console.log('생성할 스케줄 데이터:', newSchedule);
      
      const { data, error: insertError } = await supabase
        .from('schedule_events')
        .insert(newSchedule)
        .select();
      
      if (insertError) {
        console.error('스케줄 생성 실패:', JSON.stringify(insertError, null, 2));
      } else {
        console.log('조기영업 스케줄이 생성되었습니다:', data);
      }
    }
    
    console.log('작업 완료');
    
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

// 실행
createEarlySchedule();