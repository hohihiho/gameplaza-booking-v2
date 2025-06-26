// MCP를 통한 Supabase 연결 테스트
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function testSupabaseConnection() {
  console.log('🎮 Supabase MCP 연결 테스트 시작...');
  
  // 환경 변수 로드
  require('dotenv').config({ path: '.env.local' });
  
  // Supabase 클라이언트 생성
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // 연결 테스트
    console.log('✅ Supabase 클라이언트 생성 완료');
    
    // SQL 파일 읽기
    const sqlContent = fs.readFileSync('supabase/migrations/001_create_schema.sql', 'utf8');
    console.log(`📄 SQL 파일 읽기 완료 (${sqlContent.length} 글자)`);
    
    // 각 테이블 직접 확인
    console.log('🔧 주요 테이블들 확인 중...');
    
    const tablesToCheck = ['users', 'devices', 'time_slots', 'reservations', 'admins'];
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`⚠️ ${tableName} 테이블: 존재하지 않음 또는 오류 - ${error.message}`);
        } else {
          console.log(`✅ ${tableName} 테이블: 존재함 (${data?.length || 0}개 레코드)`);
        }
      } catch (err) {
        console.log(`❌ ${tableName} 테이블 확인 오류: ${err.message}`);
      }
    }
    
    // 간단한 쿼리 테스트
    console.log('🔧 간단한 쿼리 테스트 중...');
    const { data: result, error: queryError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (queryError) {
      console.log('⚠️ 사용자 테이블 쿼리 오류 (정상 - 아직 생성되지 않음):', queryError.message);
    } else {
      console.log('✅ 사용자 테이블 쿼리 성공:', result);
    }
    
  } catch (err) {
    console.log('❌ 오류 발생:', err.message);
  }
}

testSupabaseConnection();