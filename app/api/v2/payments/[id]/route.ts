import { NextRequest, NextResponse } from 'next/server'
import { GetPaymentUseCase } from '@/src/application/use-cases/payment/get-payment.use-case'
import { SupabasePaymentRepository } from '@/src/infrastructure/repositories/supabase-payment.repository'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/src/infrastructure/middleware/auth.middleware'

/**
 * 결제 상세 조회 API
 * GET /api/v2/payments/{id}
 */
export async function GET(
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

    // 2. 환경 변수 확인
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

    // 3. 서비스 초기화
    const supabase = createClient(supabaseUrl, supabaseKey)
    const paymentRepository = new SupabasePaymentRepository(supabase)
    const userRepository = new UserSupabaseRepository(supabase)

    // 4. 유스케이스 실행
    const useCase = new GetPaymentUseCase(
      paymentRepository,
      userRepository
    )

    const result = await useCase.execute({
      userId: user.id,
      paymentId: params.id
    })

    // 5. 응답 반환
    return NextResponse.json({
      payment: {
        id: result.payment.id,
        reservationId: result.payment.reservationId,
        userId: result.payment.userId,
        amount: result.payment.amount,
        method: result.payment.method,
        status: result.payment.status,
        transactionId: result.payment.transactionId,
        receiptUrl: result.payment.receiptUrl,
        paidAt: result.payment.paidAt?.toISOString(),
        failedAt: result.payment.failedAt?.toISOString(),
        failedReason: result.payment.failedReason,
        cancelledAt: result.payment.cancelledAt?.toISOString(),
        cancelledReason: result.payment.cancelledReason,
        refundedAt: result.payment.refundedAt?.toISOString(),
        refundedAmount: result.payment.refundedAmount,
        refundReason: result.payment.refundReason,
        metadata: result.payment.metadata,
        createdAt: result.payment.createdAt.toISOString(),
        updatedAt: result.payment.updatedAt.toISOString(),
        isRefundable: result.payment.isRefundable(),
        refundableAmount: result.payment.getRefundableAmount()
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Get payment error:', error)

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