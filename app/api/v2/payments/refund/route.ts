import { NextRequest, NextResponse } from 'next/server'
import { RefundPaymentUseCase } from '@/src/application/use-cases/payment/refund-payment.use-case'
import { SupabasePaymentRepository } from '@/src/infrastructure/repositories/supabase-payment.repository'
import { SupabaseReservationRepositoryV2 } from '@/src/infrastructure/repositories/supabase-reservation.repository.v2'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/src/infrastructure/middleware/auth.middleware'
import { z } from 'zod'

// 요청 바디 스키마
const refundPaymentSchema = z.object({
  paymentId: z.string().uuid('올바른 결제 ID 형식이 아닙니다'),
  amount: z.number().int().positive('환불 금액은 0보다 커야 합니다'),
  reason: z.string().min(1).max(500, '환불 사유는 500자 이내로 입력해주세요')
})

/**
 * 결제 환불 API
 * POST /api/v2/payments/refund
 */
export async function POST(request: NextRequest) {
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

    // 2. 요청 본문 파싱
    const body = await request.json()
    const validationResult = refundPaymentSchema.safeParse(body)

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
    const reservationRepository = new SupabaseReservationRepositoryV2(supabase)
    const userRepository = new UserSupabaseRepository(supabase)

    // 5. 유스케이스 실행
    const useCase = new RefundPaymentUseCase(
      paymentRepository,
      reservationRepository,
      userRepository
    )

    const result = await useCase.execute({
      userId: user.id,
      paymentId: data.paymentId,
      amount: data.amount,
      reason: data.reason
    })

    // 6. 응답 반환
    return NextResponse.json({
      success: true,
      payment: {
        id: result.payment.id,
        status: result.payment.status,
        refundedAmount: result.refundedAmount,
        remainingAmount: result.remainingAmount,
        totalRefundedAmount: result.payment.refundedAmount,
        refundedAt: result.payment.refundedAt?.toISOString()
      },
      message: result.message
    }, { status: 200 })

  } catch (error) {
    console.error('Refund payment error:', error)

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

      if (error.message.includes('환불') || 
          error.message.includes('완료된') || 
          error.message.includes('초과') ||
          error.message.includes('기간') ||
          error.message.includes('이용한') ||
          error.message.includes('관리자만')) {
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
        message: '환불 처리 중 오류가 발생했습니다' 
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