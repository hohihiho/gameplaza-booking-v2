const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteTestReservations() {
  try {
    console.log('8월 16일 14시 시작 테스트 예약 삭제 시작...');
    
    // 8월 16일 14시 시작 예약 조회
    const { data: reservations, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('date', '2025-08-16')
      .eq('start_time', '14:00:00');
    
    if (fetchError) {
      console.error('예약 조회 실패:', fetchError);
      return;
    }
    
    console.log(`14시 시작 예약 ${reservations.length}건 발견:`);
    reservations.forEach(r => {
      console.log(`- ID: ${r.id}, Status: ${r.status}, User: ${r.user_id}, Device: ${r.device_id}`);
    });
    
    if (reservations.length === 0) {
      console.log('삭제할 예약이 없습니다.');
      return;
    }
    
    // 확인 메시지
    console.log('\n위 예약들을 삭제하시겠습니까? (y/n)');
    
    // 삭제 실행
    const idsToDelete = reservations.map(r => r.id);
    
    const { error: deleteError } = await supabase
      .from('reservations')
      .delete()
      .in('id', idsToDelete);
    
    if (deleteError) {
      console.error('예약 삭제 실패:', deleteError);
    } else {
      console.log(`${reservations.length}건의 예약이 삭제되었습니다.`);
      
      // 조기영업 스케줄 재계산 필요 여부 확인
      const { data: remainingReservations } = await supabase
        .from('reservations')
        .select('start_time')
        .eq('date', '2025-08-16')
        .eq('status', 'approved')
        .order('start_time')
        .limit(1);
      
      if (remainingReservations && remainingReservations.length > 0) {
        console.log(`\n남은 예약 중 가장 빠른 시작 시간: ${remainingReservations[0].start_time}`);
        console.log('조기영업 스케줄 업데이트가 필요할 수 있습니다.');
      }
    }
    
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

// 실행
deleteTestReservations();