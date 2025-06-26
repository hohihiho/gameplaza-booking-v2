// 데이터베이스 현재 상태 확인 스크립트
// 비전공자 설명: 현재 데이터베이스에 어떤 테이블들이 있는지 확인하는 프로그램입니다

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// 색상 출력
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

async function checkDatabase() {
  log.info('🔍 데이터베이스 상태 확인 시작...\n');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    // 데이터베이스 연결
    await client.connect();
    log.success('데이터베이스 연결 성공!');
    
    // 1. 현재 테이블 목록 조회
    log.step('현재 존재하는 테이블 확인 중...\n');
    
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('📋 현재 테이블 목록:');
    if (tablesResult.rows.length === 0) {
      log.warning('  테이블이 하나도 없습니다.');
    } else {
      for (const row of tablesResult.rows) {
        // 각 테이블의 레코드 수도 확인
        try {
          const countResult = await client.query(`SELECT COUNT(*) FROM "${row.table_name}"`);
          const count = countResult.rows[0].count;
          console.log(`  ${colors.green}✓${colors.reset} ${row.table_name} (${count}개 레코드)`);
        } catch (err) {
          console.log(`  ${colors.red}✗${colors.reset} ${row.table_name} (조회 실패)`);
        }
      }
    }
    
    // 2. 예상 테이블과 비교
    console.log('\n📊 예상 테이블 vs 실제 상태:');
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
    
    const existingTables = tablesResult.rows.map(r => r.table_name);
    
    // 존재하는 테이블
    console.log('\n✅ 이미 생성된 테이블:');
    expectedTables.forEach(table => {
      if (existingTables.includes(table)) {
        log.success(`  ${table}`);
      }
    });
    
    // 없는 테이블
    console.log('\n❌ 아직 생성되지 않은 테이블:');
    expectedTables.forEach(table => {
      if (!existingTables.includes(table)) {
        log.error(`  ${table}`);
      }
    });
    
    // 예상치 못한 테이블
    const unexpectedTables = existingTables.filter(t => !expectedTables.includes(t));
    if (unexpectedTables.length > 0) {
      console.log('\n⚠️  예상치 못한 테이블:');
      unexpectedTables.forEach(table => {
        log.warning(`  ${table}`);
      });
    }
    
    // 3. 기존 스키마 vs 새 스키마 비교
    console.log('\n🔄 스키마 변경사항:');
    const oldTables = ['users', 'devices', 'device_types', 'device_time_slots', 'reservations', 'special_operations', 'settings', 'content_sections'];
    const newTables = ['machines', 'rental_machines', 'time_slots', 'special_schedules', 'admin_logs', 'notifications', 'content_pages'];
    
    console.log('\n기존 스키마 테이블:');
    oldTables.forEach(table => {
      const exists = existingTables.includes(table);
      console.log(`  ${exists ? '✓' : '✗'} ${table}`);
    });
    
    console.log('\n새 스키마 테이블:');
    newTables.forEach(table => {
      const exists = existingTables.includes(table);
      console.log(`  ${exists ? '✓' : '✗'} ${table}`);
    });
    
    // 4. 권장사항
    console.log('\n💡 권장사항:');
    if (existingTables.length > 0) {
      log.warning('이미 일부 테이블이 존재합니다.');
      log.info('다음 중 하나를 선택하세요:');
      log.info('1. 기존 테이블을 모두 삭제하고 새로 생성 (데이터 손실 주의!)');
      log.info('2. 없는 테이블만 추가로 생성');
      log.info('3. 기존 스키마를 유지하고 필요한 부분만 수정');
    } else {
      log.success('데이터베이스가 비어있습니다. 마이그레이션을 안전하게 실행할 수 있습니다.');
    }
    
  } catch (error) {
    log.error('데이터베이스 확인 중 오류 발생:');
    console.error(error);
  } finally {
    await client.end();
    log.info('\n연결 종료');
  }
}

// 실행
checkDatabase().catch(console.error);