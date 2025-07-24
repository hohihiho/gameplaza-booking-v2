import { NextRequest, NextResponse } from 'next/server'
import { CreatePaymentUseCase } from '@/src/application/use-cases/payment/create-payment.use-case'
import { ListUserPaymentsUseCase } from '@/src/application/use-cases/payment/get-payment.use-case'
import { SupabasePaymentRepository } from '@/src/infrastructure/repositories/supabase-payment.repository'
import { SupabaseReservationRepositoryV2 } from '@/src/infrastructure/repositories/supabase-reservation.repository.v2'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { SupabaseDeviceRepositoryV2 } from '@/src/infrastructure/repositories/supabase-device.repository.v2'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/src/infrastructure/middleware/auth.middleware'
import { z } from 'zod'

// POST 요청 바디 스키마
const createPaymentSchema = z.object({
  reservationId: z.string().uuid('올바른 예약 ID 형식이 아닙니다'),
  method: z.enum(['cash', 'bank_transfer'], {
    errorMap: () => ({ message: '현금 또는 계좌이체를 선택해주세요' })
  })
})

// GET 쿼리 파라미터 스키마
const listPaymentsSchema = z.object({
  targetUserId: z.string().uuid().optional(),
  status: z.string().optional(), // comma-separated values
  method: z.string().optional(), // comma-separated values
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
})

/**
 * 결제 생성 API
 * POST /api/v2/payments
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
    const validationResult = createPaymentSchema.safeParse(body)

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

    // 5. 유스케이스 실행
    const useCase = new CreatePaymentUseCase(
      paymentRepository,
      reservationRepository,
      userRepository,
      deviceRepository
    )

    const result = await useCase.execute({
      userId: user.id,
      reservationId: data.reservationId,
      method: data.method
    })

    // 6. 응답 반환
    return NextResponse.json({
      payment: {
        id: result.payment.id,
        reservationId: result.payment.reservationId,
        amount: result.payment.amount,
        method: result.payment.method,
        status: result.payment.status,
        createdAt: result.payment.createdAt.toISOString()
      },
      message: result.message
    }, { status: 201 })

  } catch (error) {
    console.error('Create payment error:', error)

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

      if (error.message.includes('권한이 없습니다') || error.message.includes('본인의')) {
        return NextResponse.json(
          { 
            error: 'Forbidden',
            message: error.message 
          },
          { status: 403 }
        )
      }

      if (error.message.includes('결제') || error.message.includes('상태')) {
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

/**
 * 결제 목록 조회 API
 * GET /api/v2/payments
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
      status: searchParams.get('status') || undefined,
      method: searchParams.get('method') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 20
    }

    const validationResult = listPaymentsSchema.safeParse(params)

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
    const useCase = new ListUserPaymentsUseCase(
      paymentRepository,
      userRepository
    )

    // 파라미터를 배열로 변환 (comma-separated)
    const statusArray = data.status ? data.status.split(',').map(s => s.trim()) : undefined
    const methodArray = data.method ? data.method.split(',').map(m => m.trim()) : undefined

    const result = await useCase.execute({
      userId: user.id,
      targetUserId: data.targetUserId,
      status: statusArray as any,
      method: methodArray as any,
      dateFrom: data.dateFrom,
      dateTo: data.dateTo,
      page: data.page,
      pageSize: data.pageSize
    })

    // 6. 응답 형식화
    const formattedPayments = result.payments.map(payment => ({
      id: payment.id,
      reservationId: payment.reservationId,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      transactionId: payment.transactionId,
      receiptUrl: payment.receiptUrl,
      paidAt: payment.paidAt?.toISOString(),
      refundedAmount: payment.refundedAmount,
      refundedAt: payment.refundedAt?.toISOString(),
      createdAt: payment.createdAt.toISOString()
    }))

    return NextResponse.json({
      payments: formattedPayments,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        hasNext: result.page < result.totalPages,
        hasPrev: result.page > 1
      },
      summary: {
        totalAmount: result.totalAmount
      }
    }, { status: 200 })

  } catch (error) {
    console.error('List payments error:', error)

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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}