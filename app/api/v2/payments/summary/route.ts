import { NextRequest, NextResponse } from 'next/server'
import { GetPaymentSummaryUseCase } from '@/src/application/use-cases/payment/get-payment.use-case'
import { SupabasePaymentRepository } from '@/src/infrastructure/repositories/supabase-payment.repository'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/src/infrastructure/middleware/auth.middleware'
import { z } from 'zod'

// 쿼리 파라미터 스키마
const getPaymentSummarySchema = z.object({
  targetUserId: z.string().uuid().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
})

/**
 * 결제 요약 정보 조회 API
 * GET /api/v2/payments/summary
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

    // 2. 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams
    const params = {
      targetUserId: searchParams.get('targetUserId') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined
    }

    const validationResult = getPaymentSummarySchema.safeParse(params)

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      return NextResponse.json(
        { 
          error: 'Bad Request',
          message: firstError.message 
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // 3. 환경 변수 확인
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

    // 4. 서비스 초기화
    const supabase = createClient(supabaseUrl, supabaseKey)
    const paymentRepository = new SupabasePaymentRepository(supabase)
    const userRepository = new UserSupabaseRepository(supabase)

    // 5. 유스케이스 실행
    const useCase = new GetPaymentSummaryUseCase(
      paymentRepository,
      userRepository
    )

    const result = await useCase.execute({
      userId: user.id,
      targetUserId: data.targetUserId,
      dateFrom: data.dateFrom,
      dateTo: data.dateTo
    })

    // 6. 응답 반환
    return NextResponse.json({
      summary: {
        totalAmount: result.totalAmount,
        completedAmount: result.completedAmount,
        refundedAmount: result.refundedAmount,
        count: result.count,
        averageAmount: result.averageAmount
      },
      breakdown: {
        byMethod: result.methodBreakdown
      },
      period: {
        from: data.dateFrom,
        to: data.dateTo
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Get payment summary error:', error)

    if (error instanceof Error) {
      if (error.message.includes('찾을 수 없습니다')) {
        return NextResponse.json(
          { 
            error: 'Not Found',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}