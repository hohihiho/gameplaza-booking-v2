/**
 * 프로덕션 DB 보호 유틸리티
 * 환경별 DB 사용 규칙:
 * - 개발(로컬): 개발 DB
 * - Vercel 프리뷰: 개발 DB
 * - Vercel 프로덕션: 운영 DB
 */

const PRODUCTION_DB_URL = 'rfcxbqlgvppqjxgpwnzd.// TODO: getDb() 사용 - co';
const DEVELOPMENT_DB_URL = 'rupeyejnfurlcpgneekg.// TODO: getDb() 사용 - co';

export function checkDatabaseEnvironment() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const nodeEnv = process.env.NODE_ENV;
  const vercelEnv = process.env.VERCEL_ENV; // production, preview, development
  const isVercel = process.env.VERCEL === '1';
  
  // 환경별 올바른 DB 확인
  let expectedDB = '';
  let envDescription = '';
  
  if (!isVercel) {
    // 로컬 개발 환경
    expectedDB = DEVELOPMENT_DB_URL;
    envDescription = '로컬 개발';
  } else if (vercelEnv === 'production') {
    // Vercel 프로덕션
    expectedDB = PRODUCTION_DB_URL;
    envDescription = 'Vercel 프로덕션';
  } else {
    // Vercel 프리뷰 (preview, development)
    expectedDB = DEVELOPMENT_DB_URL;
    envDescription = 'Vercel 프리뷰';
  }
  
  // 잘못된 DB 사용 감지
  const isUsingProductionDB = supabaseUrl.includes(PRODUCTION_DB_URL);
  const isUsingDevelopmentDB = supabaseUrl.includes(DEVELOPMENT_DB_URL);
  
  // 로컬에서 프로덕션 DB 사용 시도를 차단
  if (!isVercel && isUsingProductionDB) {
    console.error('⚠️ =====================================');
    console.error('⚠️  경고: 로컬 환경에서 프로덕션 DB 사용 시도!');
    console.error('⚠️  프로덕션 DB 접근이 차단되었습니다.');
    console.error('⚠️ =====================================');
    console.error('');
    console.error('개발 DB로 전환하려면 다음 명령어를 실행하세요:');
    console.error('  ./scripts/use-dev-db.sh');
    console.error('');
    
    // 프로세스 종료
    process.exit(1);
  }
  
  // Vercel 프리뷰에서 프로덕션 DB 사용 경고
  if (isVercel && vercelEnv !== 'production' && isUsingProductionDB) {
    console.warn('⚠️ =====================================');
    console.warn('⚠️  경고: 프리뷰 환경에서 프로덕션 DB 사용 중!');
    console.warn('⚠️  프리뷰 환경에서는 개발 DB를 사용해야 합니다.');
    console.warn('⚠️ =====================================');
  }
  
  // Vercel 프로덕션에서 개발 DB 사용 경고
  if (isVercel && vercelEnv === 'production' && isUsingDevelopmentDB) {
    console.error('❌ =====================================');
    console.error('❌  오류: 프로덕션 환경에서 개발 DB 사용 중!');
    console.error('❌  프로덕션 환경에서는 운영 DB를 사용해야 합니다.');
    console.error('❌ =====================================');
  }
  
  // 현재 환경 및 DB 정보 로깅
  console.log('');
  console.log('📍 환경 정보:');
  console.log(`   환경: ${envDescription}`);
  console.log(`   VERCEL_ENV: ${vercelEnv || 'local'}`);
  console.log(`   NODE_ENV: ${nodeEnv || 'development'}`);
  
  if (isUsingProductionDB) {
    console.log('🔴 프로덕션 DB 사용 중 (rfcxbqlgvppqjxgpwnzd)');
    console.log('   주의: 실제 운영 데이터입니다!');
  } else if (isUsingDevelopmentDB) {
    console.log('🟢 개발 DB 사용 중 (rupeyejnfurlcpgneekg)');
    console.log('   안전: 개발 데이터입니다.');
  }
  console.log('');
}

// 프로덕션 배포 여부 확인
export function isProductionDeployment() {
  return process.env.VERCEL_ENV === 'production';
}