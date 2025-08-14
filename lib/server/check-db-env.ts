/**
 * 서버 시작 시 DB 환경 체크
 * 이 파일은 서버 컴포넌트에서만 사용됩니다
 */

const PRODUCTION_DB_URL = 'rfcxbqlgvppqjxgpwnzd.supabase.co';
const DEVELOPMENT_DB_URL = 'rupeyejnfurlcpgneekg.supabase.co';

let hasChecked = false;

export function checkDatabaseEnvironment() {
  // 한 번만 체크
  if (hasChecked) return;
  hasChecked = true;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const vercelEnv = process.env.VERCEL_ENV;
  const isVercel = process.env.VERCEL === '1';
  
  // 환경별 올바른 DB 확인
  let envDescription = '';
  
  if (!isVercel) {
    envDescription = '로컬 개발';
  } else if (vercelEnv === 'production') {
    envDescription = 'Vercel 프로덕션';
  } else {
    envDescription = 'Vercel 프리뷰';
  }
  
  const isUsingProductionDB = supabaseUrl.includes(PRODUCTION_DB_URL);
  const isUsingDevelopmentDB = supabaseUrl.includes(DEVELOPMENT_DB_URL);
  
  // 로컬에서 프로덕션 DB 사용 차단
  if (!isVercel && isUsingProductionDB) {
    console.error('\n⚠️ =====================================');
    console.error('⚠️  경고: 로컬 환경에서 프로덕션 DB 사용 시도!');
    console.error('⚠️  프로덕션 DB 접근이 차단되었습니다.');
    console.error('⚠️ =====================================');
    console.error('');
    console.error('개발 DB로 전환하려면 다음 명령어를 실행하세요:');
    console.error('  ./scripts/use-dev-db.sh\n');
    
    throw new Error('로컬 환경에서 프로덕션 DB 사용 금지');
  }
  
  // 환경 정보 로깅
  console.log('\n📍 DB 환경 정보:');
  console.log(`   환경: ${envDescription}`);
  
  if (isUsingProductionDB) {
    console.log('   🔴 프로덕션 DB (rfcxbqlgvppqjxgpwnzd)');
  } else if (isUsingDevelopmentDB) {
    console.log('   🟢 개발 DB (rupeyejnfurlcpgneekg)');
  }
  console.log('');
}