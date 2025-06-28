const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupTestData() {
  console.log('🧹 테스트 데이터 정리 중...\n');

  try {
    // 현재 데이터 확인
    const { data: currentSlots, error: fetchError } = await supabase
      .from('rental_time_slots')
      .select('*')
      .order('device_type_id');

    if (fetchError) {
      console.error('데이터 조회 실패:', fetchError);
      return;
    }

    console.log(`현재 ${currentSlots.length}개의 시간대가 있습니다.`);
    
    // 각 시간대 확인
    currentSlots.forEach(slot => {
      console.log(`- ${slot.slot_type} ${slot.start_time}-${slot.end_time}`);
    });

    console.log('\n이 데이터들을 모두 삭제하시겠습니까? (대여기기관리 페이지에서 다시 설정할 수 있습니다)');
    console.log('삭제하려면 스크립트를 수정하여 실행하세요.');

    // 삭제를 원하시면 아래 주석을 해제하세요
    /*
    const { error: deleteError } = await supabase
      .from('rental_time_slots')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.error('삭제 실패:', deleteError);
    } else {
      console.log('✅ 모든 테스트 데이터 삭제 완료');
    }
    */

  } catch (error) {
    console.error('전체 에러:', error);
  }
}

cleanupTestData();