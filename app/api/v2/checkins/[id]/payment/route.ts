import { NextRequest, NextResponse } from 'next/server'
import { ConfirmPaymentUseCase } from '@/application/use-cases/checkin/confirm-payment.use-case'
import { CheckInSupabaseRepository } from '@/infrastructure/repositories/checkin.supabase.repository'
import { getAuthenticatedUser } from '@/infrastructure/middleware/auth.middleware'
import { createAdminClient } from '@/lib/db'
import { PaymentMethodType } from '@/domain/value-objects/payment-method'

/**
 * 결제 확인 API
 * PATCH /api/v2/checkins/[id]/payment
 * 
 * Request Body:
 * {
 *   "paymentMethod": "CASH" | "BANK_TRANSFER" | "CARD"
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // params를 await로 추출
    const { id } = await params
    
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
    const { paymentMethod } = body

    // 필수 필드 검증
    if (!paymentMethod) {
      return NextResponse.json(
        { 
          error: 'Bad Request',
          message: '결제 방법은 필수입니다' 
        },
        { status: 400 }
      )
    }

    // 결제 방법 유효성 검증
    const validPaymentMethods = Object.values(PaymentMethodType)
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { 
          error: 'Bad Request',
          message: `유효하지 않은 결제 방법입니다. 다음 중 하나를 선택하세요: ${validPaymentMethods.join(', ')}` 
        },
        { status: 400 }
      )
    }

    // 4. 서비스 초기화
    import { getDB, supabase } from '@/lib/db';
    const checkInRepository = new CheckInSupabaseRepository(supabase)

    // 5. 유스케이스 실행
    const useCase = new ConfirmPaymentUseCase(checkInRepository)
    const result = await useCase.execute({
      checkInId: id,
      paymentMethod
    } as any)

    // 6. 응답 반환
    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('Payment confirmation error:', error)

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

      if (error.message.includes('체크인 상태에서만 결제를 확인할 수 있습니다') ||
          error.message.includes('결제를 완료할 수 없는 상태입니다')) {
        return NextResponse.json(
          { 
            error: 'Conflict',
            message: error.message 
          },
          { status: 409 }
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