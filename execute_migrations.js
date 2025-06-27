const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL 또는 Service Role Key가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeMigrations() {
  try {
    console.log('=== 현재 테이블 목록 확인 ===');
    
    // 현재 테이블 목록 조회
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables_list', {});
    
    if (tablesError) {
      // RPC 함수가 없을 수 있으므로 직접 쿼리 실행
      const { data: tablesData, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (error) {
        console.log('테이블 목록 조회 중 오류:', error.message);
      } else {
        console.log('현재 테이블:', tablesData?.map(t => t.table_name).join(', ') || '없음');
      }
    } else {
      console.log('현재 테이블:', tables);
    }

    console.log('\n=== 마이그레이션 파일 실행 ===');
    
    // 마이그레이션 파일 읽기 및 실행
    const migrationFiles = [
      '002_device_management.sql',
      '003_device_seed_data.sql'
    ];

    for (const fileName of migrationFiles) {
      console.log(`\n${fileName} 실행 중...`);
      
      const filePath = path.join(__dirname, 'supabase', 'migrations', fileName);
      const sqlContent = await fs.readFile(filePath, 'utf-8');
      
      // SQL 문을 세미콜론으로 분리하여 각각 실행
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';
        
        try {
          // Supabase의 rpc를 사용하여 직접 SQL 실행
          const { error } = await supabase.rpc('exec_sql', { 
            query: statement 
          }).single();
          
          if (error) {
            // rpc 함수가 없을 수 있으므로 다른 방법 시도
            console.log(`구문 ${i + 1}/${statements.length} 실행 중 오류:`, error.message);
          } else {
            console.log(`구문 ${i + 1}/${statements.length} 성공`);
          }
        } catch (err) {
          console.log(`구문 ${i + 1}/${statements.length} 실행 중 예외:`, err.message);
        }
      }
      
      console.log(`${fileName} 완료`);
    }

    console.log('\n=== 생성된 테이블 확인 ===');
    
    // 생성된 테이블 확인
    const tablesToCheck = [
      'device_categories',
      'device_types', 
      'play_modes',
      'rental_settings',
      'devices',
      'rental_time_slots'
    ];

    for (const tableName of tablesToCheck) {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${tableName}: 테이블 없음 또는 오류`);
      } else {
        console.log(`✅ ${tableName}: ${count}개 레코드`);
      }
    }

    console.log('\n=== 샘플 데이터 확인 ===');
    
    // 카테고리 데이터 확인
    const { data: categories } = await supabase
      .from('device_categories')
      .select('*')
      .order('display_order');
    
    if (categories && categories.length > 0) {
      console.log('\n카테고리:', categories.map(c => c.name).join(', '));
    }

    // 기기 타입 데이터 확인
    const { data: deviceTypes } = await supabase
      .from('device_types')
      .select('*, device_categories(name)')
      .eq('is_rentable', true);
    
    if (deviceTypes && deviceTypes.length > 0) {
      console.log('\n대여 가능 기기:');
      deviceTypes.forEach(dt => {
        console.log(`- ${dt.device_categories.name}: ${dt.name}`);
      });
    }

    console.log('\n✅ 마이그레이션 완료!');

  } catch (error) {
    console.error('마이그레이션 실행 중 오류:', error);
  }
}

executeMigrations();