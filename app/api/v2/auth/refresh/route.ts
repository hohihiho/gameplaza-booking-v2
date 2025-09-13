import { NextRequest, NextResponse } from 'next/server'
import { RefreshTokenUseCase } from '@/application/use-cases/auth/refresh-token.use-case'
import { JWTTokenService } from '@/infrastructure/services/jwt-token.service'
import { AuthDomainService } from '@/domain/services/auth-domain.service'
import { UserSupabaseRepository } from '@/infrastructure/repositories/user.supabase.repository'
import { SessionSupabaseRepository } from '@/infrastructure/repositories/session.supabase.repository'
import { RefreshTokenRequestDto } from '@/application/dtos/auth.dto'
import { createAdminClient } from '@/lib/db'

/**
 * 토큰 갱신 API
 * POST /api/v2/auth/refresh
 */
export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await request.json()
    
    // 요청 DTO 생성
    const refreshRequest: RefreshTokenRequestDto = {
      refreshToken: body.refreshToken
    }

    // 필수 필드 검증
    if (!refreshRequest.refreshToken) {
      return NextResponse.json(
        { 
          error: 'Bad Request',
          message: 'Refresh token is required' 
        },
        { status: 400 }
      )
    }

    // 환경 변수 확인
    const accessTokenSecret = process.env.JWT_ACCESS_SECRET
    const refreshTokenSecret = process.env.JWT_REFRESH_SECRET

    if (!accessTokenSecret || !refreshTokenSecret) {
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
    import { getDB, supabase } from '@/lib/db';
    const tokenService = new JWTTokenService(accessTokenSecret, refreshTokenSecret)
    const authDomainService = new AuthDomainService(tokenService as any)
    const userRepository = new UserSupabaseRepository(supabase)
    const sessionRepository = new SessionSupabaseRepository(supabase)

    // 유스케이스 실행
    const useCase = new RefreshTokenUseCase(
      authDomainService,
      userRepository,
      sessionRepository
    )

    const result = await useCase.execute(refreshRequest)

    // 성공 응답
    return NextResponse.json(result, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Token refresh error:', error)

    // 에러 타입에 따른 응답
    if (error instanceof Error) {
      if (error.message.includes('유효하지 않은 리프레시 토큰')) {
        return NextResponse.json(
          { 
            error: 'Invalid Token',
            message: error.message 
          },
          { status: 401 }
        )
      }

      if (error.message.includes('세션을 찾을 수 없습니다') || 
          error.message.includes('세션이 만료되었거나')) {
        return NextResponse.json(
          { 
            error: 'Session Expired',
            message: error.message 
          },
          { status: 401 }
        )
      }

      if (error.message.includes('사용자를 찾을 수 없습니다')) {
        return NextResponse.json(
          { 
            error: 'User Not Found',
            message: error.message 
          },
          { status: 404 }
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