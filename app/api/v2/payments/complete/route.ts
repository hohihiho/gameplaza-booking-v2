import { NextRequest, NextResponse } from 'next/server'
import { CompletePaymentUseCase } from '@/src/application/use-cases/payment/complete-payment.use-case'
import { SupabasePaymentRepository } from '@/src/infrastructure/repositories/supabase-payment.repository'
import { SupabaseReservationRepositoryV2 } from '@/src/infrastructure/repositories/supabase-reservation.repository.v2'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { SupabaseDeviceRepositoryV2 } from '@/src/infrastructure/repositories/supabase-device.repository.v2'
import { SupabaseNotificationRepository } from '@/src/infrastructure/repositories/supabase-notification.repository'
import { SupabaseNotificationService } from '@/src/infrastructure/services/supabase-notification.service'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/src/infrastructure/middleware/auth.middleware'

// 요청 바디 스키마
const completePaymentSchema = z.object({
  paymentId: z.string().uuid('올바른 결제 ID 형식이 아닙니다'),
  receiptNumber: z.string().optional()
})

/**
 * 결제 완료 처리 API
 * POST /api/v2/payments/complete
 * 
 * 관리자가 현장에서 결제를 받고 완료 처리
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
    const validationResult = completePaymentSchema.safeParse(body)

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
    const deviceRepository = new SupabaseDeviceRepositoryV2(supabase)
    const notificationRepository = new SupabaseNotificationRepository(supabase)
    const notificationService = new SupabaseNotificationService(supabase)

    // 5. 유스케이스 실행
    const useCase = new CompletePaymentUseCase(
      paymentRepository,
      reservationRepository,
      userRepository,
      deviceRepository,
      notificationRepository,
      notificationService
    )

    const result = await useCase.execute({
      userId: user.id,
      paymentId: data.paymentId,
      receiptNumber: data.receiptNumber
    })

    // 6. 응답 반환
    return NextResponse.json({
      success: true,
      payment: {
        id: result.payment.id,
        reservationId: result.payment.reservationId,
        amount: result.payment.amount,
        method: result.payment.method,
        status: result.payment.status,
        transactionId: result.payment.transactionId,
        receiptNumber: result.payment.receiptNumber,
        paidAt: result.payment.paidAt?.toISOString()
      },
      reservation: {
        id: result.reservation.id,
        status: result.reservation.status.value
      },
      message: result.message
    }, { status: 200 })

  } catch (error) {
    console.error('Complete payment error:', error)

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

      if (error.message.includes('잘못된') || 
          error.message.includes('완료된') || 
          error.message.includes('처리 중인') ||
          error.message.includes('검증') ||
          error.message.includes('일치하지')) {
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
        message: '결제 처리 중 오류가 발생했습니다' 
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