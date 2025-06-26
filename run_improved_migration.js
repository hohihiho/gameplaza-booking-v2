// GamePlaza V2 개선된 스키마 마이그레이션 스크립트
// 이 파일은 데이터베이스에 새로운 테이블 구조를 만드는 프로그램입니다.

// 필요한 라이브러리를 가져옵니다
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// 색상이 있는 콘솔 출력을 위한 헬퍼 함수들
// 비전공자 설명: 터미널에 색깔 있는 글자를 출력하기 위한 코드입니다
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// 로그 함수들 - 상태에 따라 다른 색으로 메시지를 출력합니다
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}▶${colors.reset} ${msg}`)
};

// 데이터베이스 연결을 위한 메인 함수
async function runMigration() {
  log.info('🎮 GamePlaza V2 개선된 스키마 마이그레이션 시작...\n');
  
  try {
    // 환경 변수에서 Supabase 연결 정보를 가져옵니다
    // 비전공자 설명: .env.local 파일에 저장된 비밀번호 같은 중요한 정보를 읽어옵니다
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.');
    }
    
    // Supabase 클라이언트 생성 (데이터베이스에 연결하는 도구)
    log.step('Supabase에 연결 중...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    log.success('Supabase 연결 성공!');
    
    // SQL 파일 읽기
    // 비전공자 설명: 데이터베이스에 실행할 명령어가 담긴 파일을 읽어옵니다
    log.step('마이그레이션 SQL 파일 읽는 중...');
    const sqlPath = path.join(__dirname, 'supabase/migrations/002_improved_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    log.success(`SQL 파일 읽기 완료 (${sqlContent.length} 글자)`);
    
    // SQL을 개별 명령어로 분리
    // 비전공자 설명: 하나의 큰 파일을 여러 개의 작은 명령어로 나눕니다
    log.step('SQL 명령어 분석 중...');
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    log.info(`총 ${statements.length}개의 SQL 명령어를 실행합니다.\n`);
    
    // 각 SQL 명령어를 순차적으로 실행
    // 비전공자 설명: 준비된 명령어를 하나씩 데이터베이스에 실행합니다
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      const preview = statement.substring(0, 60).replace(/\n/g, ' ');
      
      try {
        log.step(`[${i + 1}/${statements.length}] 실행 중: ${preview}...`);
        
        // SQL 실행
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement 
        }).catch(async (rpcError) => {
          // RPC 함수가 없으면 직접 실행 시도
          // 비전공자 설명: 첫 번째 방법이 안 되면 다른 방법으로 시도합니다
          log.warning('exec_sql 함수를 찾을 수 없어 직접 쿼리 실행을 시도합니다...');
          
          // Supabase의 직접 쿼리 실행은 제한적이므로 
          // 대신 PostgreSQL 직접 연결을 사용해야 합니다
          return { error: 'RPC 함수를 사용할 수 없습니다. PostgreSQL 직접 연결이 필요합니다.' };
        });
        
        if (error) {
          throw error;
        }
        
        log.success(`[${i + 1}/${statements.length}] 성공!`);
        successCount++;
        
      } catch (error) {
        errorCount++;
        log.error(`[${i + 1}/${statements.length}] 실패: ${error.message || error}`);
        
        // DROP TABLE 오류는 무시 (테이블이 없어서 발생하는 오류)
        if (statement.includes('DROP TABLE') && error.message?.includes('does not exist')) {
          log.warning('(테이블이 존재하지 않아 삭제를 건너뜁니다)');
          errorCount--; // 이건 실제 오류가 아니므로 카운트에서 제외
        }
      }
    }
    
    // 결과 요약
    console.log('\n' + '='.repeat(50));
    log.info('📊 마이그레이션 결과 요약:');
    log.success(`성공: ${successCount}개`);
    if (errorCount > 0) {
      log.error(`실패: ${errorCount}개`);
    }
    console.log('='.repeat(50) + '\n');
    
    // 생성된 테이블 확인
    log.step('생성된 테이블 확인 중...');
    const tablesToCheck = [
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
    
    console.log('\n📋 테이블 생성 상태:');
    for (const tableName of tablesToCheck) {
      try {
        const { error } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
        if (!error) {
          log.success(`${tableName} 테이블 ✓`);
        } else {
          log.error(`${tableName} 테이블 ✗ - ${error.message}`);
        }
      } catch (err) {
        log.error(`${tableName} 테이블 확인 실패: ${err.message}`);
      }
    }
    
    if (errorCount === 0) {
      console.log('\n' + colors.green + '🎉 마이그레이션이 성공적으로 완료되었습니다!' + colors.reset);
    } else {
      console.log('\n' + colors.yellow + '⚠️  일부 오류가 발생했습니다. 위의 오류 메시지를 확인하세요.' + colors.reset);
      console.log('PostgreSQL에 직접 연결하여 마이그레이션을 실행하는 것을 권장합니다.');
    }
    
  } catch (error) {
    console.error('\n' + colors.red + '❌ 마이그레이션 중 오류가 발생했습니다:' + colors.reset);
    console.error(error);
    process.exit(1);
  }
}

// 프로그램 실행
// 비전공자 설명: 위에서 만든 함수를 실제로 실행합니다
runMigration().catch(console.error);