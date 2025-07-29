import { NextRequest, NextResponse } from 'next/server'
import { LogoutUseCase } from '@/src/application/use-cases/auth/logout.use-case'
import { SessionSupabaseRepository } from '@/src/infrastructure/repositories/session.supabase.repository'
import { LogoutRequestDto } from '@/src/application/dtos/auth.dto'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getAuthenticatedUser } from '@/src/infrastructure/middleware/auth.middleware'

/**
 * 로그아웃 API
 * POST /api/v2/auth/logout
 */
export async function POST(request: NextRequest) {
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

    // 요청 본문 파싱
    const body = await request.json()
    
    // 요청 DTO 생성
    const logoutRequest: LogoutRequestDto = {
      sessionId: body.sessionId || user.sessionId,
      allDevices: body.allDevices || false
    }

    // 서비스 초기화
    const supabase = createServiceRoleClient()
    const sessionRepository = new SessionSupabaseRepository(supabase)

    // 유스케이스 실행
    const useCase = new LogoutUseCase(sessionRepository)
    await useCase.execute(user.id, logoutRequest)

    // 성공 응답
    return NextResponse.json(
      { 
        message: logoutRequest.allDevices 
          ? '모든 디바이스에서 로그아웃되었습니다' 
          : '로그아웃되었습니다'
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Logout error:', error)

    // 에러 타입에 따른 응답
    if (error instanceof Error) {
      if (error.message.includes('세션을 찾을 수 없습니다')) {
        return NextResponse.json(
          { 
            error: 'Session Not Found',
            message: error.message 
          },
          { status: 404 }
        )
      }

      if (error.message.includes('권한이 없습니다')) {
        return NextResponse.json(
          { 
            error: 'Forbidden',
            message: error.message 
          },
          { status: 403 }
        )
      }

      if (error.message.includes('세션 ID를 제공하거나')) {
        return NextResponse.json(
          { 
            error: 'Bad Request',
            message: error.message 
          },
          { status: 400 }
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

// 인증은 POST 함수 내에서 직접 처리