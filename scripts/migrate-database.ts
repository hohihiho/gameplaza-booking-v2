// 데이터베이스 마이그레이션 스크립트
// Cloudflare D1과 로컬 SQLite 모두 지원

import { readFileSync } from 'fs';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import path from 'path';

// 환경 변수 확인
function checkEnvironment() {
  console.log('🔍 환경 변수 확인 중...');
  
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ 개발 환경: 로컬 SQLite 사용');
    return 'development';
  } else {
    console.log('✅ 프로덕션 환경: Cloudflare D1 사용');
    return 'production';
  }
}

// 로컬 SQLite 데이터베이스 설정
async function setupLocalDatabase() {
  console.log('📦 로컬 SQLite 데이터베이스 설정 중...');
  
  const client = createClient({
    url: 'file:./drizzle/dev.db'
  });
  
  const db = drizzle(client);
  
  // 스키마 파일 읽기
  const schemaPath = path.join(process.cwd(), 'drizzle/schema-gameplaza-v2.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  
  // 스키마를 개별 SQL 문으로 분리 (개선된 파싱)
  // 1. 주석 제거
  const cleanSchema = schema.replace(/--.*$/gm, '');
  
  // 2. 정규식으로 완전한 SQL 문 추출 (CREATE로 시작하고 );로 끝나는 패턴)
  const sqlStatementRegex = /(CREATE\s+(?:TABLE|INDEX)\s+[^;]*);/gis;
  const matches = cleanSchema.match(sqlStatementRegex) || [];
  
  const allStatements = matches
    .map(statement => statement.trim())
    .filter(statement => statement.length > 0);
  
  // 디버깅: 파싱된 SQL 문들 출력
  console.log('📊 파싱된 전체 SQL 문 개수:', allStatements.length);
  allStatements.forEach((stmt, index) => {
    const preview = stmt.substring(0, 80).replace(/\s+/g, ' ');
    console.log(`${index + 1}. ${preview}...`);
  });

  // CREATE TABLE 문을 CREATE INDEX 문보다 먼저 실행하도록 정렬
  const createTables = allStatements.filter(stmt => 
    stmt.toUpperCase().startsWith('CREATE TABLE')
  );
  const createIndexes = allStatements.filter(stmt => 
    stmt.toUpperCase().startsWith('CREATE INDEX')
  );
  const otherStatements = allStatements.filter(stmt => 
    !stmt.toUpperCase().startsWith('CREATE TABLE') && 
    !stmt.toUpperCase().startsWith('CREATE INDEX')
  );

  // 실행 순서: 테이블 → 기타 → 인덱스
  const statements = [...createTables, ...otherStatements, ...createIndexes];
  
  console.log(`📄 ${statements.length}개의 SQL 문 실행 중... (테이블: ${createTables.length}, 인덱스: ${createIndexes.length}, 기타: ${otherStatements.length})`);
  
  // 첫 번째 문을 디버깅을 위해 출력
  if (statements.length > 0) {
    console.log('🔍 첫 번째 SQL 문:', statements[0].substring(0, 100) + '...');
  }
  
  // 각 SQL 문 실행
  for (const [index, statement] of statements.entries()) {
    try {
      await client.execute(statement);
      console.log(`✅ SQL 문 ${index + 1}/${statements.length} 완료`);
    } catch (error) {
      // 테이블이 이미 존재하는 경우 무시
      if (error.message.includes('already exists')) {
        console.log(`⚠️  SQL 문 ${index + 1}/${statements.length} 건너뜀 (이미 존재)`);
        continue;
      }
      console.error(`❌ SQL 문 ${index + 1} 실행 실패:`, error);
      throw error;
    }
  }
  
  console.log('✅ 로컬 데이터베이스 설정 완료');
  return db;
}

// Cloudflare D1 설정 (향후 구현)
async function setupCloudflareD1() {
  console.log('☁️  Cloudflare D1 설정은 wrangler를 통해 수행됩니다.');
  console.log('💡 다음 명령어를 실행하세요:');
  console.log('   wrangler d1 create gameplaza-v2');
  console.log('   wrangler d1 execute gameplaza-v2 --file=./drizzle/schema-gameplaza-v2.sql');
  
  throw new Error('Cloudflare D1 마이그레이션은 수동으로 수행해야 합니다.');
}

// 메인 마이그레이션 함수
async function migrate() {
  console.log('🚀 게임플라자 데이터베이스 마이그레이션 시작');
  console.log('=====================================');
  
  try {
    const environment = checkEnvironment();
    
    if (environment === 'development') {
      await setupLocalDatabase();
    } else {
      await setupCloudflareD1();
    }
    
    console.log('=====================================');
    console.log('✅ 마이그레이션 완료!');
    
    // 기본 데이터 삽입 제안
    console.log('');
    console.log('💡 다음 단계:');
    console.log('   1. npm run seed 명령어로 기본 데이터 삽입');
    console.log('   2. npm run dev 명령어로 개발 서버 시작');
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate();
}

export { migrate };