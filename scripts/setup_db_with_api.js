const https = require('https');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function executeSQLViaAPI() {
  try {
    console.log('=== Supabase 데이터베이스 설정 시작 ===\n');
    
    // 마이그레이션 파일 읽기
    const migrationFiles = [
      '002_device_management.sql',
      '003_device_seed_data.sql'
    ];

    console.log('다음 작업을 수행해주세요:\n');
    console.log('1. Supabase 대시보드에 로그인: https://app.supabase.com');
    console.log('2. 프로젝트 선택');
    console.log('3. SQL Editor 탭 클릭');
    console.log('4. 아래 SQL들을 순서대로 실행:\n');

    for (const fileName of migrationFiles) {
      console.log(`\n=== ${fileName} ===`);
      console.log('다음 SQL을 복사해서 실행하세요:\n');
      
      const filePath = path.join(__dirname, 'supabase', 'migrations', fileName);
      const sqlContent = await fs.readFile(filePath, 'utf-8');
      
      // 전체 SQL 파일을 combined SQL로 저장
      const outputPath = path.join(__dirname, `ready_to_execute_${fileName}`);
      await fs.writeFile(outputPath, sqlContent);
      
      console.log(`파일 저장됨: ${outputPath}`);
      console.log('이 파일의 내용을 Supabase SQL Editor에 붙여넣고 실행하세요.\n');
    }

    // 통합 SQL 파일 생성
    console.log('\n=== 통합 SQL 파일 생성 ===');
    let combinedSQL = '-- 게임플라자 기기 관리 시스템 초기 설정\n\n';
    
    for (const fileName of migrationFiles) {
      const filePath = path.join(__dirname, 'supabase', 'migrations', fileName);
      const sqlContent = await fs.readFile(filePath, 'utf-8');
      combinedSQL += `-- ${fileName}\n${sqlContent}\n\n`;
    }

    const combinedPath = path.join(__dirname, 'complete_migration.sql');
    await fs.writeFile(combinedPath, combinedSQL);
    
    console.log(`통합 파일 생성됨: ${combinedPath}`);
    console.log('\n이 파일 하나로 모든 마이그레이션을 한 번에 실행할 수 있습니다.');

    // 확인용 쿼리
    const checkQueries = `
-- 생성된 테이블 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('device_categories', 'device_types', 'play_modes', 'rental_settings', 'devices', 'rental_time_slots')
ORDER BY table_name;

-- 카테고리 데이터 확인
SELECT * FROM device_categories ORDER BY display_order;

-- 대여 가능한 기기 타입 확인
SELECT dt.name as device_name, dc.name as category_name, dt.is_rentable
FROM device_types dt
JOIN device_categories dc ON dt.category_id = dc.id
WHERE dt.is_rentable = true
ORDER BY dc.display_order, dt.name;

-- 기기별 상태 확인
SELECT dt.name as device_type, d.device_number, d.status
FROM devices d
JOIN device_types dt ON d.device_type_id = dt.id
ORDER BY dt.name, d.device_number;
`;

    await fs.writeFile(path.join(__dirname, 'check_migration.sql'), checkQueries);
    console.log('\n확인용 쿼리 저장됨: check_migration.sql');
    console.log('마이그레이션 실행 후 이 쿼리로 결과를 확인하세요.');

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

executeSQLViaAPI();