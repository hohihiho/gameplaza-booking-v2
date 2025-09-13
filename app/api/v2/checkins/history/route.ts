import { NextRequest, NextResponse } from 'next/server'
import { GetCheckInsByDateRangeUseCase } from '@/src/application/use-cases/checkin/get-checkins-by-date-range.use-case'
import { CheckInSupabaseRepository } from '@/src/infrastructure/repositories/checkin.supabase.repository'
import { getAuthenticatedUser } from '@/src/infrastructure/middleware/auth.middleware'
import { createAdminClient } from '@/lib/db'

/**
 * 체크인 이력 조회 API
 * GET /api/v2/checkins/history
 * 
 * Query Parameters:
 * - startDate: ISO 8601 date string (required)
 * - endDate: ISO 8601 date string (required)
 * - deviceId?: string - 특정 기기의 체크인만 조회
 * - userId?: string - 특정 사용자의 체크인만 조회
 * 
 * 참고:
 * - 날짜는 KST 기준으로 처리됨
 * - 최대 조회 기간은 3개월
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 인증 확인
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

    // 2. 관리자 권한 확인
    if (user.role !== 'admin') {
      return NextResponse.json(
        { 
          error: 'Forbidden',
          message: '관리자 권한이 필요합니다' 
        },
        { status: 403 }
      )
    }

    // 3. URL 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const deviceId = searchParams.get('deviceId') || undefined
    const userId = searchParams.get('userId') || undefined

    // 필수 파라미터 검증
    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { 
          error: 'Bad Request',
          message: '시작일과 종료일은 필수입니다' 
        },
        { status: 400 }
      )
    }

    // 날짜 유효성 검증
    const startDate = new Date(startDateParam)
    const endDate = new Date(endDateParam)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { 
          error: 'Bad Request',
          message: '유효하지 않은 날짜 형식입니다' 
        },
        { status: 400 }
      )
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { 
          error: 'Bad Request',
          message: '시작일은 종료일보다 이전이어야 합니다' 
        },
        { status: 400 }
      )
    }

    // 최대 조회 기간 검증 (3개월)
    const maxDuration = 90 * 24 * 60 * 60 * 1000 // 90일
    if (endDate.getTime() - startDate.getTime() > maxDuration) {
      return NextResponse.json(
        { 
          error: 'Bad Request',
          message: '최대 조회 기간은 3개월입니다' 
        },
        { status: 400 }
      )
    }

    // 4. 서비스 초기화
    const supabase = createAdminClient()
    const checkInRepository = new CheckInSupabaseRepository(supabase)

    // 5. 유스케이스 실행
    const useCase = new GetCheckInsByDateRangeUseCase(
      checkInRepository as any
    )

    const result = await useCase.execute({
      startDate,
      endDate,
      deviceId,
      userId
    })

    // 6. 응답 반환
    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('Get check-in history error:', error)

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