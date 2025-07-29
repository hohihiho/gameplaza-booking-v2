/**
 * Jest 테스트 환경 설정
 * .env.test 파일을 로드하여 테스트용 환경 변수 설정
 */

const { config } = require('dotenv')
const path = require('path')
const fs = require('fs')

// .env.test 파일 경로 확인
const envTestPath = path.resolve(process.cwd(), '.env.test')
console.log('🔍 .env.test 파일 경로:', envTestPath)
console.log('📁 파일 존재 여부:', fs.existsSync(envTestPath))

// .env.test 파일 로드
const result = config({ 
  path: envTestPath,
  override: true // 기존 환경 변수 덮어쓰기
})

if (result.error) {
  console.error('❌ .env.test 로드 실패:', result.error)
  throw result.error
}

console.log('✅ .env.test 로드 성공')

// 테스트 환경 검증
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('테스트용 NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('테스트용 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.')
}

// 테스트용 프로젝트인지 확인 (안전장치)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL.includes('jlqpflqopzdkzvmbjput')) {
  console.error('⚠️  현재 URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  throw new Error('⚠️  테스트용 Supabase 프로젝트가 아닙니다! 프로덕션 데이터베이스 사용 금지!')
}

console.log('✅ 테스트 환경 설정 완료:', {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '없음',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '없음',
  nodeEnv: process.env.NODE_ENV
})