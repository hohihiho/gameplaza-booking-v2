import { JWTTokenService } from '../src/infrastructure/services/jwt-token.service'
import { createClient } from '@supabase/supabase-js'
import { UserSupabaseRepository } from '../src/infrastructure/repositories/user.supabase.repository'
import { SessionSupabaseRepository } from '../src/infrastructure/repositories/session.supabase.repository'
import { Session } from '../src/domain/entities/session'

/**
 * 테스트용 JWT 토큰 생성 스크립트
 * 
 * 사용법:
 * npx ts-node scripts/generate-test-token.ts <user-email>
 */

async function generateTestToken() {
  try {
    // 환경 변수 확인
    const accessTokenSecret = process.env.JWT_ACCESS_SECRET
    const refreshTokenSecret = process.env.JWT_REFRESH_SECRET
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!accessTokenSecret || !refreshTokenSecret || !supabaseUrl || !supabaseKey) {
      console.error('필수 환경 변수가 설정되지 않았습니다')
      console.error('JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY가 필요합니다')
      process.exit(1)
    }

    // 이메일 파라미터 확인
    const email = process.argv[2]
    if (!email) {
      console.error('사용법: npx ts-node scripts/generate-test-token.ts <user-email>')
      process.exit(1)
    }

    // 서비스 초기화
    const tokenService = new JWTTokenService(accessTokenSecret, refreshTokenSecret)
    const supabase = createClient(supabaseUrl, supabaseKey)
    const userRepository = new UserSupabaseRepository(supabase)
    const sessionRepository = new SessionSupabaseRepository(supabase)

    // 사용자 조회
    const user = await userRepository.findByEmail(email)
    if (!user) {
      console.error(`사용자를 찾을 수 없습니다: ${email}`)
      process.exit(1)
    }

    console.log(`사용자 찾음: ${user.email} (${user.role})`)

    // 세션 생성
    const session = Session.create({
      userId: user.id,
      userAgent: 'Test Script',
      ipAddress: '127.0.0.1'
    })

    const savedSession = await sessionRepository.create(session)
    console.log(`세션 생성됨: ${savedSession.id}`)

    // 토큰 생성
    const { accessToken, refreshToken } = await tokenService.generateTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: savedSession.id
    })

    console.log('\n=== 생성된 토큰 ===')
    console.log('\nAccess Token:')
    console.log(accessToken)
    console.log('\nRefresh Token:')
    console.log(refreshToken)
    console.log('\n=== 사용 방법 ===')
    console.log('curl 예시:')
    console.log(`curl -H "Authorization: Bearer ${accessToken}" http://localhost:3000/api/v2/checkins`)
    console.log('\nHTTP 클라이언트 헤더:')
    console.log(`Authorization: Bearer ${accessToken}`)

  } catch (error) {
    console.error('토큰 생성 중 오류 발생:', error)
    process.exit(1)
  }
}

// 실행
generateTestToken()