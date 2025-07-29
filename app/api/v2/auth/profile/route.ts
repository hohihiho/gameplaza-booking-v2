import { NextRequest, NextResponse } from 'next/server'
import { GetProfileUseCase } from '@/src/application/use-cases/auth/get-profile.use-case'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { getAuthenticatedUser } from '@/src/infrastructure/middleware/auth.middleware'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * 프로필 조회 API
 * GET /api/v2/auth/profile
 */
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: '인증이 필요합니다' 
        },
        { status: 401 }
      )
    }

    // 서비스 초기화
    const supabase = createServiceRoleClient()
    const userRepository = new UserSupabaseRepository(supabase)

    // 유스케이스 실행
    const useCase = new GetProfileUseCase(userRepository)
    const profile = await useCase.execute(user.id)

    // 성공 응답
    return NextResponse.json(profile, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Get profile error:', error)

    // 에러 타입에 따른 응답
    if (error instanceof Error) {
      if (error.message.includes('사용자를 찾을 수 없습니다')) {
        return NextResponse.json(
          { 
            error: 'User Not Found',
            message: error.message 
          },
          { status: 404 }
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}

// 인증은 GET 함수 내에서 직접 처리