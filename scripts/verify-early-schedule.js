const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyEarlySchedule() {
  try {
    console.log('8월 16일 예약 및 스케줄 상태 확인...\n');
    
    // 1. 승인된 예약 확인
    const { data: reservations, error: reservationError } = await supabase
      .from('reservations')
      .select('id, status, start_time, end_time, user_id')
      .eq('date', '2025-08-16')
      .eq('status', 'approved')
      .order('start_time');
    
    if (reservationError) {
      console.error('예약 조회 실패:', reservationError);
      return;
    }
    
    console.log(`✅ 승인된 예약: ${reservations.length}건`);
    reservations.forEach(r => {
      console.log(`   - ${r.start_time} ~ ${r.end_time}`);
    });
    
    // 2. 조기영업 스케줄 확인
    const { data: schedule } = await supabase
      .from('schedule_events')
      .select('*')
      .eq('date', '2025-08-16')
      .eq('type', 'early_open')
      .single();
    
    if (schedule) {
      console.log(`\n✅ 조기영업 스케줄 존재`);
      console.log(`   - 시작 시간: ${schedule.start_time}`);
      console.log(`   - 자동 생성: ${schedule.is_auto_generated ? '예' : '아니오'}`);
      console.log(`   - 설명: ${schedule.description}`);
    } else {
      console.log('\n❌ 조기영업 스케줄 없음');
    }
    
    // 3. 검증
    if (reservations.length > 0 && schedule) {
      const earliestReservation = reservations[0].start_time;
      if (earliestReservation === schedule.start_time) {
        console.log('\n✅ 조기영업 시작 시간이 정확합니다.');
      } else {
        console.log(`\n⚠️ 조기영업 시간 불일치!`);
        console.log(`   예약 최초 시간: ${earliestReservation}`);
        console.log(`   스케줄 시작 시간: ${schedule.start_time}`);
      }
    }
    
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

// 실행
verifyEarlySchedule();