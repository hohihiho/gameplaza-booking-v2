const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 생성
const supabaseUrl = 'https://rupeyejnfurlcpgneekg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1cGV5ZWpuZnVybGNwZ25lZWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDg2NjQyOCwiZXhwIjoyMDY2NDQyNDI4fQ.49VEsYv-jDnKPb1wK_wBmXgcdQWnYilLYaqbbaAHCt4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testMigration() {
  console.log('🔍 마이그레이션 결과 확인 중...\n');
  
  try {
    // 1. reservations 테이블의 새 컬럼 확인
    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select('id, actual_start_time, actual_end_time, time_adjustment_reason, adjusted_amount')
      .limit(1);
    
    if (!resError) {
      console.log('✅ reservations 테이블에 새 필드가 추가되었습니다:');
      console.log('   - actual_start_time');
      console.log('   - actual_end_time');
      console.log('   - time_adjustment_reason');
      console.log('   - adjusted_amount\n');
    } else {
      console.log('❌ reservations 테이블 확인 실패:', resError.message);
    }
    
    // 2. time_adjustments 테이블 확인
    const { data: timeAdj, error: timeError } = await supabase
      .from('time_adjustments')
      .select('*')
      .limit(1);
    
    if (!timeError) {
      console.log('✅ time_adjustments 테이블이 생성되었습니다\n');
    } else if (timeError.message.includes('relation "time_adjustments" does not exist')) {
      console.log('⚠️  time_adjustments 테이블이 아직 생성되지 않았습니다');
      console.log('   Supabase 대시보드에서 SQL을 직접 실행해주세요\n');
    }
    
    console.log('📋 다음 단계:');
    console.log('1. Supabase 대시보드 (https://supabase.com/dashboard) 접속');
    console.log('2. SQL Editor에서 011_add_actual_time_fields.sql 실행');
    console.log('3. 체크인 관리 페이지에 시간 조정 UI 추가 예정');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

testMigration();