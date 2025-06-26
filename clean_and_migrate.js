// GamePlaza V2 클린 마이그레이션 스크립트
// 비전공자 설명: 기존 테이블을 모두 삭제하고 새로운 구조로 다시 만드는 프로그램입니다

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// 색상 출력 설정
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// 로그 함수들
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}▶${colors.reset} ${msg}`)
};

async function cleanAndMigrate() {
  log.info('🧹 GamePlaza V2 클린 마이그레이션 시작...\n');
  log.warning('⚠️  주의: 모든 기존 테이블이 삭제됩니다!\n');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    // 데이터베이스 연결
    await client.connect();
    log.success('데이터베이스 연결 성공!');
    
    // 1단계: 기존 테이블 모두 삭제
    log.step('\n[1/3] 기존 테이블 삭제 중...');
    
    // 현재 존재하는 모든 테이블 조회
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    if (tablesResult.rows.length > 0) {
      log.info(`${tablesResult.rows.length}개의 테이블을 삭제합니다...`);
      
      // CASCADE로 모든 테이블 삭제 (의존성 무시)
      // 비전공자 설명: CASCADE는 연결된 데이터도 함께 삭제하는 옵션입니다
      for (const row of tablesResult.rows) {
        try {
          await client.query(`DROP TABLE IF EXISTS "${row.table_name}" CASCADE`);
          log.success(`  ${row.table_name} 테이블 삭제 완료`);
        } catch (err) {
          log.error(`  ${row.table_name} 테이블 삭제 실패: ${err.message}`);
        }
      }
    } else {
      log.info('삭제할 테이블이 없습니다.');
    }
    
    // 트리거 함수도 삭제
    log.step('트리거 함수 삭제 중...');
    await client.query('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE');
    await client.query('DROP FUNCTION IF EXISTS is_admin() CASCADE');
    await client.query('DROP FUNCTION IF EXISTS generate_reservation_number() CASCADE');
    log.success('트리거 함수 삭제 완료');
    
    // 2단계: 새로운 스키마 적용
    log.step('\n[2/3] 새로운 스키마 적용 중...');
    
    // SQL 파일 읽기
    const sqlPath = path.join(__dirname, 'supabase/migrations/002_improved_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    log.success(`SQL 파일 읽기 완료 (${sqlContent.length} 글자)`);
    
    // 전체 SQL 실행
    log.step('새로운 테이블 생성 중... (시간이 걸릴 수 있습니다)');
    
    try {
      await client.query(sqlContent);
      log.success('모든 테이블 생성 완료!');
    } catch (error) {
      // DROP TABLE 오류는 무시 (이미 삭제했으므로)
      if (error.message.includes('does not exist') && error.message.includes('DROP')) {
        log.warning('DROP TABLE 명령 건너뜀 (이미 삭제됨)');
        
        // DROP 문을 제거하고 다시 실행
        const sqlWithoutDrops = sqlContent
          .split(';')
          .filter(stmt => !stmt.trim().toUpperCase().startsWith('DROP'))
          .join(';');
        
        await client.query(sqlWithoutDrops);
        log.success('모든 테이블 생성 완료!');
      } else {
        throw error;
      }
    }
    
    // 3단계: 결과 확인
    log.step('\n[3/3] 마이그레이션 결과 확인 중...');
    
    // 생성된 테이블 목록 확인
    const newTablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('\n📋 생성된 테이블 목록:');
    const expectedTables = [
      'users',
      'admins', 
      'machines',
      'rental_machines',
      'time_slots',
      'reservations',
      'special_schedules',
      'admin_logs',
      'notifications',
      'settings',
      'content_pages'
    ];
    
    const createdTables = newTablesResult.rows.map(r => r.table_name);
    
    expectedTables.forEach(table => {
      if (createdTables.includes(table)) {
        log.success(`  ${table}`);
      } else {
        log.error(`  ${table} (생성 실패)`);
      }
    });
    
    // 설정 데이터 확인
    log.step('\n기본 설정 데이터 확인 중...');
    const settingsResult = await client.query('SELECT key, value FROM settings');
    
    if (settingsResult.rows.length > 0) {
      console.log('\n⚙️  초기 설정값:');
      settingsResult.rows.forEach(row => {
        console.log(`  • ${row.key}`);
      });
    }
    
    // 최종 통계
    console.log('\n' + '='.repeat(60));
    console.log(`📊 최종 결과:`);
    console.log(`  • 생성된 테이블: ${createdTables.length}개`);
    console.log(`  • 초기 설정값: ${settingsResult.rows.length}개`);
    console.log('='.repeat(60));
    
    console.log('\n' + colors.green + colors.bright + 
      '🎉 클린 마이그레이션이 성공적으로 완료되었습니다!' + colors.reset);
    console.log('\n다음 단계:');
    console.log('1. npm run dev 로 개발 서버를 시작하세요');
    console.log('2. 관리자 계정을 생성하세요');
    console.log('3. 기기 정보를 등록하세요\n');
    
  } catch (error) {
    console.error('\n' + colors.red + '❌ 마이그레이션 중 오류가 발생했습니다:' + colors.reset);
    console.error(error.message);
    
    // 상세 오류 정보
    if (error.detail) {
      console.error('상세:', error.detail);
    }
    if (error.hint) {
      console.error('힌트:', error.hint);
    }
    
    process.exit(1);
  } finally {
    await client.end();
    log.info('데이터베이스 연결 종료');
  }
}

// 사용자 확인 후 실행
// 비전공자 설명: 실수로 실행하는 것을 방지하기 위한 확인 절차입니다
console.log(colors.yellow + '\n⚠️  경고: 이 작업은 모든 기존 데이터를 삭제합니다!' + colors.reset);
console.log('계속하려면 5초 후에 자동으로 시작됩니다...');
console.log('취소하려면 Ctrl+C를 누르세요.\n');

let countdown = 5;
const timer = setInterval(() => {
  process.stdout.write(`\r${countdown}초...`);
  countdown--;
  
  if (countdown < 0) {
    clearInterval(timer);
    console.log('\n');
    cleanAndMigrate().catch(console.error);
  }
}, 1000);