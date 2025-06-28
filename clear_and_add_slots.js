const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearAndAddSlots() {
  console.log('🧹 기존 대여 시간대 삭제 중...\n');

  try {
    // 기존 데이터 삭제
    const { error: deleteError } = await supabase
      .from('rental_time_slots')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 데이터 삭제

    if (deleteError) {
      console.error('삭제 실패:', deleteError);
    } else {
      console.log('✅ 기존 데이터 삭제 완료\n');
    }

    // 새 데이터 추가
    await require('./add_test_rental_slots.js');

  } catch (error) {
    console.error('전체 에러:', error);
  }
}

clearAndAddSlots();