const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  try {
    console.log('기기 관리 테이블 생성 중...');
    
    // 스키마 생성
    const schemaSql = fs.readFileSync(
      path.join(__dirname, 'supabase', 'migrations', '002_device_management.sql'),
      'utf8'
    );
    
    const { error: schemaError } = await supabase.rpc('exec_sql', {
      sql: schemaSql
    });
    
    if (schemaError) {
      console.error('스키마 생성 실패:', schemaError);
      return;
    }
    
    console.log('✅ 테이블 생성 완료');
    
    // 시드 데이터 삽입
    console.log('초기 데이터 삽입 중...');
    
    const seedSql = fs.readFileSync(
      path.join(__dirname, 'supabase', 'migrations', '003_device_seed_data.sql'),
      'utf8'
    );
    
    const { error: seedError } = await supabase.rpc('exec_sql', {
      sql: seedSql
    });
    
    if (seedError) {
      console.error('데이터 삽입 실패:', seedError);
      return;
    }
    
    console.log('✅ 초기 데이터 삽입 완료');
    console.log('🎉 기기 관리 마이그레이션 완료!');
    
  } catch (error) {
    console.error('마이그레이션 실패:', error);
  }
}

runMigration();