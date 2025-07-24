import { NextRequest, NextResponse } from 'next/server'
import { AdjustTimeAndAmountUseCase } from '@/src/application/use-cases/checkin/adjust-time-and-amount.use-case'
import { CheckInSupabaseRepository } from '@/src/infrastructure/repositories/checkin.supabase.repository'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/src/infrastructure/middleware/auth.middleware'

/**
 * 시간/금액 조정 API
 * PATCH /api/v2/checkins/[id]/adjust
 * 
 * Request Body:
 * {
 *   "adjustedStartTime"?: "ISO 8601 date string",
 *   "adjustedEndTime"?: "ISO 8601 date string",
 *   "adjustedAmount"?: number,
 *   "adjustmentReason"?: string
 * }
 * 
 * 참고:
 * - 시간 조정과 금액 조정은 독립적으로 가능
 * - 금액 조정 시 adjustmentReason 필수
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // 3. 요청 본문 파싱
    const body = await request.json()
    const { adjustedStartTime, adjustedEndTime, adjustedAmount, adjustmentReason } = body

    // 유효성 검증
    if (!adjustedStartTime && !adjustedEndTime && adjustedAmount === undefined) {
      return NextResponse.json(
        { 
          error: 'Bad Request',
          message: '조정할 시간 또는 금액을 입력해주세요' 
        },
        { status: 400 }
      )
    }

    if (adjustedAmount !== undefined && !adjustmentReason) {
      return NextResponse.json(
        { 
          error: 'Bad Request',
          message: '금액 조정 시 조정 사유는 필수입니다' 
        },
        { status: 400 }
      )
    }

    if (adjustedAmount !== undefined && adjustedAmount < 0) {
      return NextResponse.json(
        { 
          error: 'Bad Request',
          message: '조정 금액은 0원 이상이어야 합니다' 
        },
        { status: 400 }
      )
    }

    // 4. 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing required environment variables')
      return NextResponse.json(
        { 
          error: 'Internal Server Error',
          message: '서버 설정 오류' 
        },
        { status: 500 }
      )
    }

    // 5. 서비스 초기화
    const supabase = createClient(supabaseUrl, supabaseKey)
    const checkInRepository = new CheckInSupabaseRepository(supabase)

    // 6. 유스케이스 실행
    const useCase = new AdjustTimeAndAmountUseCase(checkInRepository)
    const result = await useCase.execute({
      checkInId: params.id,
      adjustedStartTime: adjustedStartTime ? new Date(adjustedStartTime) : undefined,
      adjustedEndTime: adjustedEndTime ? new Date(adjustedEndTime) : undefined,
      adjustedAmount,
      adjustmentReason,
      adminId: user.id
    })

    // 7. 응답 반환
    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('Time/amount adjustment error:', error)

    // 에러 타입에 따른 응답
    if (error instanceof Error) {
      if (error.message.includes('체크인 정보를 찾을 수 없습니다')) {
        return NextResponse.json(
          { 
            error: 'Not Found',
            message: error.message 
          },
          { status: 404 }
        )
      }

      if (error.message.includes('활성 상태의 체크인만')) {
        return NextResponse.json(
          { 
            error: 'Conflict',
            message: error.message 
          },
          { status: 409 }
        )
      }

      if (error.message.includes('금액은 0원 이상') ||
          error.message.includes('조정 사유를 입력해주세요')) {
        return NextResponse.json(
          { 
            error: 'Bad Request',
            message: error.message 
          },
          { status: 400 }
        )
      }
    }

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
      'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}