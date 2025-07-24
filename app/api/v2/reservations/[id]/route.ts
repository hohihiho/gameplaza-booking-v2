import { NextRequest, NextResponse } from 'next/server'
import { GetReservationUseCase } from '@/src/application/use-cases/reservation/get-reservation.use-case'
import { UpdateReservationUseCase } from '@/src/application/use-cases/reservation/update-reservation.use-case'
import { SupabaseReservationRepositoryV2 } from '@/src/infrastructure/repositories/supabase-reservation.repository.v2'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { SupabaseDeviceRepositoryV2 } from '@/src/infrastructure/repositories/supabase-device.repository.v2'
import { SupabasePaymentRepository } from '@/src/infrastructure/repositories/supabase-payment.repository'
import { SupabaseNotificationRepository } from '@/src/infrastructure/repositories/supabase-notification.repository'
import { SupabaseNotificationService } from '@/src/infrastructure/services/supabase-notification.service'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/src/infrastructure/middleware/auth.middleware'
import { z } from 'zod'

// PATCH 요청 바디 스키마
const updateReservationSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)').optional(),
  timeSlot: z.object({
    startHour: z.number().int().min(0).max(29),
    endHour: z.number().int().min(0).max(29)
  }).refine(data => data.endHour > data.startHour, {
    message: '종료 시간은 시작 시간보다 커야 합니다'
  }).optional(),
  note: z.string().max(500, '메모는 500자 이내로 입력해주세요').optional()
}).refine(data => {
  // 최소 하나의 필드는 있어야 함
  return data.date !== undefined || data.timeSlot !== undefined || data.note !== undefined
}, {
  message: '수정할 내용이 없습니다'
})

/**
 * 예약 상세 조회 API
 * GET /api/v2/reservations/{id}
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
    const reservationRepository = new SupabaseReservationRepositoryV2(supabase)
    const userRepository = new UserSupabaseRepository(supabase)
    const deviceRepository = new SupabaseDeviceRepositoryV2(supabase)

    // 4. 유스케이스 실행
    const useCase = new GetReservationUseCase(
      reservationRepository,
      userRepository,
      deviceRepository
    )

    const result = await useCase.execute({
      userId: user.id,
      reservationId: params.id
    })

    // 5. 응답 반환
    return NextResponse.json({
      reservation: {
        id: result.reservation.id,
        userId: result.reservation.userId,
        deviceId: result.reservation.deviceId,
        date: result.reservation.date.dateString,
        timeSlot: {
          startHour: result.reservation.timeSlot.startHour,
          endHour: result.reservation.timeSlot.endHour
        },
        status: result.reservation.status.value,
        note: result.reservation.note,
        createdAt: result.reservation.createdAt.toISOString(),
        updatedAt: result.reservation.updatedAt.toISOString()
      },
      device: result.device ? {
        id: result.device.id,
        deviceNumber: result.device.deviceNumber,
        name: result.device.name,
        type: result.device.type
      } : undefined,
      user: result.user ? {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email
      } : undefined
    }, { status: 200 })

  } catch (error) {
    console.error('Get reservation error:', error)

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

/**
 * 예약 수정 API
 * PATCH /api/v2/reservations/{id}
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

    // 2. 요청 본문 파싱
    const body = await request.json()
    const validationResult = updateReservationSchema.safeParse(body)

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
    const reservationRepository = new SupabaseReservationRepositoryV2(supabase)
    const userRepository = new UserSupabaseRepository(supabase)
    const deviceRepository = new SupabaseDeviceRepositoryV2(supabase)
    const paymentRepository = new SupabasePaymentRepository(supabase)
    const notificationRepository = new SupabaseNotificationRepository(supabase)
    const notificationService = new SupabaseNotificationService(supabase)

    // 5. 유스케이스 실행
    const useCase = new UpdateReservationUseCase(
      reservationRepository,
      userRepository,
      deviceRepository,
      paymentRepository,
      notificationRepository,
      notificationService
    )

    const result = await useCase.execute({
      userId: user.id,
      reservationId: params.id,
      date: data.date,
      timeSlot: data.timeSlot,
      note: data.note
    })

    // 6. 응답 반환
    return NextResponse.json({
      reservation: {
        id: result.reservation.id,
        userId: result.reservation.userId,
        deviceId: result.reservation.deviceId,
        date: result.reservation.date.dateString,
        timeSlot: {
          startHour: result.reservation.timeSlot.startHour,
          endHour: result.reservation.timeSlot.endHour
        },
        status: result.reservation.status.value,
        note: result.reservation.note,
        createdAt: result.reservation.createdAt.toISOString(),
        updatedAt: result.reservation.updatedAt.toISOString()
      },
      message: result.message
    }, { status: 200 })

  } catch (error) {
    console.error('Update reservation error:', error)

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

      if (error.message.includes('수정할 수 없습니다') || 
          error.message.includes('24시간') ||
          error.message.includes('이미 다른 예약이') ||
          error.message.includes('과거 날짜') ||
          error.message.includes('영업시간')) {
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
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}