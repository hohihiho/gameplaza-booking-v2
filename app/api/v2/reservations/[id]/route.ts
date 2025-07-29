import { NextRequest, NextResponse } from 'next/server'
import { GetReservationUseCase } from '@/src/application/use-cases/reservation/get-reservation.use-case'
import { UpdateReservationUseCase } from '@/src/application/use-cases/reservation/update-reservation.use-case'
import { CancelReservationUseCase } from '@/src/application/use-cases/reservation/cancel-reservation.use-case'
import { SupabaseReservationRepositoryV2 } from '@/src/infrastructure/repositories/supabase-reservation.repository.v2'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { SupabaseDeviceRepositoryV2 } from '@/src/infrastructure/repositories/supabase-device.repository.v2'
import { PaymentSupabaseRepository } from '@/src/infrastructure/repositories/payment.supabase.repository'
import { NotificationSupabaseRepository } from '@/src/infrastructure/repositories/notification.supabase.repository'
import { NotificationService } from '@/src/infrastructure/services/notification.service'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
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

    // 2. 서비스 초기화
    const supabase = createServiceRoleClient()
    const reservationRepository = new SupabaseReservationRepositoryV2(supabase)
    const userRepository = new UserSupabaseRepository(supabase)
    const deviceRepository = new SupabaseDeviceRepositoryV2(supabase)

    // 3. 유스케이스 실행
    const useCase = new GetReservationUseCase(
      reservationRepository,
      userRepository,
      deviceRepository
    )

    const result = await useCase.execute({
      userId: user.id,
      reservationId: id
    })

    // 4. 응답 반환
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
        userNotes: result.reservation.note,
        createdAt: result.reservation.createdAt.toISOString(),
        updatedAt: result.reservation.updatedAt.toISOString()
      }
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

    // 2. 요청 본문 파싱
    const body = await request.json()
    const validationResult = updateReservationSchema.safeParse(body)

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      return NextResponse.json(
        { 
          error: 'Bad Request',
          message: firstError?.message ?? '유효하지 않은 요청입니다' 
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // 3. 서비스 초기화
    const supabase = createServiceRoleClient()
    const reservationRepository = new SupabaseReservationRepositoryV2(supabase)
    const userRepository = new UserSupabaseRepository(supabase)
    const deviceRepository = new SupabaseDeviceRepositoryV2(supabase)
    const paymentRepository = new PaymentSupabaseRepository(supabase)
    const notificationRepository = new NotificationSupabaseRepository(supabase)
    const notificationService = new NotificationService(supabase)

    // 4. 유스케이스 실행
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
      reservationId: id,
      date: data.date,
      timeSlot: data.timeSlot,
      note: data.note
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
        userNotes: result.reservation.note,
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

/**
 * 예약 취소 API
 * DELETE /api/v2/reservations/{id}
 */
export async function DELETE(
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

    // 2. 취소 사유 파싱 (선택사항)
    let reason: string | undefined
    try {
      const body = await request.json()
      if (body.reason && typeof body.reason === 'string') {
        reason = body.reason.slice(0, 500) // 최대 500자
      }
    } catch {
      // 바디가 없거나 파싱 실패시 무시
    }

    // 3. 서비스 초기화
    const supabase = createServiceRoleClient()
    const reservationRepository = new SupabaseReservationRepositoryV2(supabase)
    const userRepository = new UserSupabaseRepository(supabase)
    const deviceRepository = new SupabaseDeviceRepositoryV2(supabase)
    const notificationRepository = new NotificationSupabaseRepository(supabase)
    const notificationService = new NotificationService(supabase)

    // 4. 유스케이스 실행
    const useCase = new CancelReservationUseCase(
      reservationRepository,
      userRepository,
      deviceRepository,
      notificationRepository,
      notificationService
    )

    const result = await useCase.execute({
      userId: user.id,
      reservationId: id,
      reason
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
        userNotes: result.reservation.note,
        createdAt: result.reservation.createdAt.toISOString(),
        updatedAt: result.reservation.updatedAt.toISOString()
      },
      message: '예약이 취소되었습니다'
    }, { status: 200 })

  } catch (error) {
    console.error('Cancel reservation error:', error)

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

      if (error.message.includes('취소할 수 없습니다') || 
          error.message.includes('2시간 전까지만') ||
          error.message.includes('활성 상태가 아닌') ||
          error.message.includes('체크인된')) {
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
      'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}