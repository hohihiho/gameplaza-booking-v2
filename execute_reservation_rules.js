const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createReservationRulesTable() {
  console.log('🔧 예약 확인사항 테이블 생성 중...\n');

  try {
    // 테이블이 이미 있는지 확인
    const { data: existingData, error: checkError } = await supabase
      .from('reservation_rules')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('✅ reservation_rules 테이블이 이미 존재합니다.');
      
      // 현재 데이터 확인
      const { data: rules, count } = await supabase
        .from('reservation_rules')
        .select('*', { count: 'exact' })
        .order('display_order');
      
      console.log(`\n현재 ${count}개의 예약 규칙이 있습니다:`);
      rules?.forEach(rule => {
        console.log(`- ${rule.title}: ${rule.content.substring(0, 50)}...`);
      });
      
      return;
    }

    console.log('❌ 테이블이 없습니다. SQL 파일을 실행해주세요.');
    console.log('\nSupabase 대시보드에서 다음 SQL을 실행하세요:');
    console.log('create_reservation_rules_table.sql 파일의 내용');

  } catch (error) {
    console.error('전체 에러:', error);
  }
}

createReservationRulesTable();