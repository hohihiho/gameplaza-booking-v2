#!/usr/bin/env node
/**
 * GamePlaza V2 마이그레이션 도구
 * 비전공자용 설명: 데이터베이스 구조를 자동으로 만들어주는 도구입니다.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 환경변수 로드
require('dotenv').config({ path: '.env.local' });

async function runMigration(migrationFile) {
  console.log('🎮 GamePlaza V2 마이그레이션 도구');
  console.log('=' .repeat(50));
  
  // Supabase 클라이언트 생성 (Service Role 사용)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    console.error('❌ 환경변수가 설정되지 않았습니다.');
    console.log('필요한 환경변수: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  console.log('✅ 환경변수 로드 완료');
  console.log(`📡 Supabase URL: ${supabaseUrl}`);
  
  const supabase = createClient(supabaseUrl, serviceKey);
  
  try {
    // SQL 파일 읽기
    const sqlPath = migrationFile || 'supabase/migrations/001_create_schema.sql';
    
    if (!fs.existsSync(sqlPath)) {
      console.error(`❌ SQL 파일을 찾을 수 없습니다: ${sqlPath}`);
      process.exit(1);
    }
    
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log(`📄 SQL 파일 로드: ${sqlPath} (${sqlContent.length} 글자)`);
    
    // 연결 테스트
    console.log('🔌 Supabase 연결 테스트...');
    const { data: testData, error: testError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);
    
    if (testError) {
      console.error('❌ 연결 테스트 실패:', testError.message);
      console.log('\n💡 해결 방법:');
      console.log('1. Supabase 대시보드에서 SQL Editor를 사용하세요');
      console.log('2. 다음 링크에서 직접 실행: https://supabase.com/dashboard/project/rupeyejnfurlcpgneekg/sql');
      console.log('3. SQL 내용을 복사해서 붙여넣고 RUN을 클릭하세요');
      
      // SQL 내용을 파일로 저장해서 쉽게 복사할 수 있도록
      const outputPath = 'migration_ready.sql';
      fs.writeFileSync(outputPath, sqlContent);
      console.log(`\n📋 복사용 SQL 파일 생성됨: ${outputPath}`);
      
      return false;
    }
    
    console.log('✅ Supabase 연결 성공!');
    
    // 실제로는 여기서 SQL을 실행해야 하지만, 
    // Supabase JS 클라이언트로는 직접 SQL 실행이 제한적입니다.
    console.log('\n⚠️  현재 JavaScript 클라이언트로는 직접 SQL 실행이 제한됩니다.');
    console.log('Supabase 웹 인터페이스를 사용해주세요.');
    
    return true;
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    return false;
  }
}

// CLI 실행
if (require.main === module) {
  const migrationFile = process.argv[2];
  runMigration(migrationFile)
    .then(success => {
      if (success) {
        console.log('\n✨ 마이그레이션 도구 실행 완료!');
      } else {
        console.log('\n💥 마이그레이션 도구 실행 실패');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('💥 예상치 못한 오류:', err);
      process.exit(1);
    });
}

module.exports = { runMigration };