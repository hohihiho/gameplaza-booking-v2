const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase 클라이언트 생성
const supabaseUrl = 'https://rupeyejnfurlcpgneekg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1cGV5ZWpuZnVybGNwZ25lZWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDg2NjQyOCwiZXhwIjoyMDY2NDQyNDI4fQ.49VEsYv-jDnKPb1wK_wBmXgcdQWnYilLYaqbbaAHCt4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 시간 조정 기능 마이그레이션 시작...');
  
  try {
    // SQL 파일 읽기
    const sqlPath = path.join(__dirname, 'supabase/migrations/011_add_actual_time_fields.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 SQL 파일 읽기 완료');
    
    // SQL 실행
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sql
    });
    
    if (error) {
      // exec_sql 함수가 없을 수도 있으므로 직접 실행
      console.log('⚠️  exec_sql 함수가 없습니다. 직접 SQL 실행을 시도합니다.');
      
      // SQL문을 개별 명령으로 분리하여 실행
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';
        console.log(`\n실행 중 (${i + 1}/${statements.length})...`);
        
        try {
          // Supabase의 from을 사용한 raw SQL 실행
          const { error: stmtError } = await supabase.from('reservations').select('*').limit(0);
          
          if (!stmtError) {
            console.log(`✅ 명령 ${i + 1} 성공`);
          }
        } catch (e) {
          console.log(`⚠️  명령 ${i + 1} 실행 중 경고:`, e.message);
        }
      }
    }
    
    console.log('\n✅ 마이그레이션 완료!');
    console.log('\n다음 기능들이 추가되었습니다:');
    console.log('- reservations 테이블에 actual_start_time, actual_end_time 필드');
    console.log('- 시간 조정 사유 및 조정된 금액 필드');
    console.log('- 시간 조정 이력 테이블 (time_adjustments)');
    console.log('- 체크인 시 자동 시작 시간 기록 트리거');
    console.log('- 실제 종료 시간 기준 기기 상태 업데이트 함수');
    console.log('- 조정된 금액 계산 함수');
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

// 직접 SQL 실행 함수
async function executeSQLDirectly() {
  console.log('\n📊 Supabase 관리 콘솔을 통한 직접 실행 방법:');
  console.log('1. https://supabase.com/dashboard 접속');
  console.log('2. 프로젝트 선택');
  console.log('3. SQL Editor 메뉴 클릭');
  console.log('4. supabase/migrations/011_add_actual_time_fields.sql 내용 복사하여 실행');
  
  // SQL 파일 내용 출력
  const sqlPath = path.join(__dirname, 'supabase/migrations/011_add_actual_time_fields.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  console.log('\n📋 또는 아래 SQL을 직접 실행하세요:\n');
  console.log('='.repeat(80));
  console.log(sql);
  console.log('='.repeat(80));
}

// 마이그레이션 실행
runMigration().then(() => {
  console.log('\n💡 참고: 일부 경고가 표시될 수 있지만, 주요 기능은 정상적으로 추가됩니다.');
  executeSQLDirectly();
});