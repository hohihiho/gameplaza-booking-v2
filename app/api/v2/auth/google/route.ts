import { NextRequest, NextResponse } from 'next/server'
import { GoogleAuthUseCase } from '@/src/application/use-cases/auth/google-auth.use-case'
import { GoogleAuthService } from '@/src/infrastructure/services/google-auth.service'
import { JWTTokenService } from '@/src/infrastructure/services/jwt-token.service'
import { AuthDomainService } from '@/src/domain/services/auth-domain.service'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { SessionSupabaseRepository } from '@/src/infrastructure/repositories/session.supabase.repository'
import { createClient } from '@supabase/supabase-js'
import { AuthRequestDto } from '@/src/application/dtos/auth.dto'

/**
 * Google OAuth 로그인 API
 * POST /api/v2/auth/google
 */
export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await request.json()
    
    // 요청 DTO 생성
    const authRequest: AuthRequestDto = {
      googleIdToken: body.googleIdToken,
      deviceInfo: body.deviceInfo,
      ipAddress: request.headers.get('x-forwarded-for') || request.ip || undefined,
      userAgent: request.headers.get('user-agent') || undefined
    }

    // 필수 필드 검증
    if (!authRequest.googleIdToken) {
      return NextResponse.json(
        { 
          error: 'Bad Request',
          message: 'Google ID token is required' 
        },
        { status: 400 }
      )
    }

    // 환경 변수 확인
    const googleClientId = process.env.GOOGLE_CLIENT_ID
    const accessTokenSecret = process.env.JWT_ACCESS_SECRET
    const refreshTokenSecret = process.env.JWT_REFRESH_SECRET
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!googleClientId || !accessTokenSecret || !refreshTokenSecret || !supabaseUrl || !supabaseKey) {
      console.error('Missing required environment variables')
      return NextResponse.json(
        { 
          error: 'Internal Server Error',
          message: '서버 설정 오류' 
        },
        { status: 500 }
      )
    }

    // 서비스 초기화
    const supabase = createClient(supabaseUrl, supabaseKey)
    const googleAuthService = new GoogleAuthService(googleClientId)
    const tokenService = new JWTTokenService(accessTokenSecret, refreshTokenSecret)
    const authDomainService = new AuthDomainService(tokenService)
    const userRepository = new UserSupabaseRepository(supabase)
    const sessionRepository = new SessionSupabaseRepository(supabase)

    // 유스케이스 실행
    const useCase = new GoogleAuthUseCase(
      googleAuthService,
      authDomainService,
      userRepository,
      sessionRepository
    )

    const result = await useCase.execute(authRequest)

    // 성공 응답
    return NextResponse.json(result, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Google auth error:', error)

    // 에러 타입에 따른 응답
    if (error instanceof Error) {
      if (error.message.includes('이메일 인증이 필요합니다')) {
        return NextResponse.json(
          { 
            error: 'Email Verification Required',
            message: error.message 
          },
          { status: 400 }
        )
      }

      if (error.message.includes('Google 인증 실패')) {
        return NextResponse.json(
          { 
            error: 'Authentication Failed',
            message: error.message 
          },
          { status: 401 }
        )
      }

      if (error.message.includes('로그인할 수 없는')) {
        return NextResponse.json(
          { 
            error: 'Account Restricted',
            message: error.message 
          },
          { status: 403 }
        )
      }
    }

    // 기본 에러 응답
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: '서버 오류가 발생했습니다' 
      },
      { status: 500 }
    )
  }
}

// OPTIONS 요청 처리 (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}