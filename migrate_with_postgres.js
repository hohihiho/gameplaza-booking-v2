// GamePlaza V2 PostgreSQL 직접 연결 마이그레이션
// 비전공자 설명: 이 파일은 데이터베이스에 직접 연결해서 테이블을 만드는 프로그램입니다

const { Client } = require('pg'); // PostgreSQL 연결 도구
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// 색상 있는 출력을 위한 설정
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

async function runMigration() {
  log.info('🎮 GamePlaza V2 PostgreSQL 마이그레이션 시작...\n');
  
  // 데이터베이스 연결 설정
  // 비전공자 설명: DATABASE_URL은 데이터베이스 주소와 비밀번호가 담긴 문자열입니다
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    log.error('DATABASE_URL 환경 변수가 설정되지 않았습니다.');
    log.info('.env.local 파일에 다음 형식으로 추가하세요:');
    log.info('DATABASE_URL=postgresql://postgres:[비밀번호]@db.[프로젝트ID].supabase.co:5432/postgres');
    process.exit(1);
  }
  
  // PostgreSQL 클라이언트 생성
  // 비전공자 설명: 데이터베이스와 대화할 수 있는 연결 도구를 만듭니다
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false } // Supabase는 SSL 연결을 사용합니다
  });
  
  try {
    // 데이터베이스 연결
    log.step('PostgreSQL 데이터베이스에 연결 중...');
    await client.connect();
    log.success('데이터베이스 연결 성공!');
    
    // SQL 파일 읽기
    log.step('마이그레이션 SQL 파일 읽는 중...');
    const sqlPath = path.join(__dirname, 'supabase/migrations/002_improved_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    log.success(`SQL 파일 읽기 완료 (${sqlContent.length} 글자)`);
    
    // 전체 SQL을 한 번에 실행
    // 비전공자 설명: 준비된 모든 명령어를 데이터베이스에 실행합니다
    log.step('마이그레이션 실행 중... (시간이 걸릴 수 있습니다)');
    
    try {
      await client.query(sqlContent);
      log.success('모든 SQL 명령어 실행 완료!');
    } catch (error) {
      // 오류 상세 정보 출력
      log.error('SQL 실행 중 오류 발생:');
      console.error(error.message);
      
      // DROP TABLE 오류는 경고로만 처리
      if (error.message.includes('does not exist') && error.message.includes('DROP')) {
        log.warning('일부 테이블이 존재하지 않아 삭제를 건너뛰었습니다. (정상)');
      } else {
        throw error;
      }
    }
    
    // 생성된 테이블 확인
    log.step('\n생성된 테이블 확인 중...');
    
    // 공개 스키마의 모든 테이블 목록 조회
    // 비전공자 설명: 데이터베이스에 어떤 테이블들이 만들어졌는지 확인합니다
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('\n📋 생성된 테이블 목록:');
    tablesResult.rows.forEach(row => {
      log.success(`  ${row.table_name}`);
    });
    
    // 각 테이블의 레코드 수 확인
    console.log('\n📊 테이블별 데이터 현황:');
    for (const row of tablesResult.rows) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) FROM ${row.table_name}`);
        const count = countResult.rows[0].count;
        console.log(`  ${row.table_name}: ${count}개 레코드`);
      } catch (err) {
        console.log(`  ${row.table_name}: 조회 실패`);
      }
    }
    
    // 설정 데이터 확인
    log.step('\n기본 설정 데이터 확인 중...');
    const settingsResult = await client.query('SELECT key, value FROM settings');
    if (settingsResult.rows.length > 0) {
      console.log('\n⚙️  설정 데이터:');
      settingsResult.rows.forEach(row => {
        console.log(`  ${row.key}: ${JSON.stringify(row.value)}`);
      });
    }
    
    console.log('\n' + colors.green + '🎉 마이그레이션이 성공적으로 완료되었습니다!' + colors.reset);
    console.log('이제 애플리케이션을 시작할 수 있습니다.');
    
  } catch (error) {
    console.error('\n' + colors.red + '❌ 마이그레이션 중 오류가 발생했습니다:' + colors.reset);
    console.error(error);
    process.exit(1);
  } finally {
    // 연결 종료
    // 비전공자 설명: 작업이 끝나면 데이터베이스와의 연결을 끊습니다
    await client.end();
    log.info('데이터베이스 연결 종료');
  }
}

// 프로그램 실행
runMigration().catch(console.error);