/**
 * 서버 시작 시 Cloudflare D1 환경 체크
 * 이 파일은 서버 컴포넌트에서만 사용됩니다
 */

let hasChecked = false;

export function checkDatabaseEnvironment() {
  // 한 번만 체크
  if (hasChecked) return;
  hasChecked = true;
  
  const vercelEnv = process.env.VERCEL_ENV;
  const isVercel = process.env.VERCEL === '1';
  const d1DatabaseId = process.env.D1_DATABASE_ID;
  const d1DevDatabaseId = process.env.D1_DEV_DATABASE_ID;
  
  // 환경별 올바른 DB 확인
  let envDescription = '';
  
  if (!isVercel) {
    envDescription = '로컬 개발 (SQLite)';
  } else if (vercelEnv === 'production') {
    envDescription = 'Vercel 프로덕션 (Cloudflare D1)';
  } else {
    envDescription = 'Vercel 프리뷰 (Cloudflare D1)';
  }
  
  // 환경 정보 로깅
  console.log('\n📍 Cloudflare D1 환경 정보:');
  console.log(`   환경: ${envDescription}`);
  
  if (!isVercel) {
    console.log('   🟡 로컬 SQLite (dev.db)');
  } else if (vercelEnv === 'production' && d1DatabaseId) {
    console.log(`   🔴 프로덕션 D1 (${d1DatabaseId.substring(0, 8)}...)`);
  } else if (d1DevDatabaseId) {
    console.log(`   🟢 개발 D1 (${d1DevDatabaseId.substring(0, 8)}...)`);
  } else {
    console.log('   ⚠️ D1 데이터베이스 ID가 설정되지 않음');
  }
  console.log('');
}