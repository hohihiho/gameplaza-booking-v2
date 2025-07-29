import { NextRequest, NextResponse } from 'next/server'
import { CreateReservationV2UseCase } from '@/src/application/use-cases/reservation/create-reservation.v2.use-case'
import { SupabaseReservationRepositoryV2 } from '@/src/infrastructure/repositories/supabase-reservation.repository.v2'
import { SupabaseDeviceRepositoryV2 } from '@/src/infrastructure/repositories/supabase-device.repository.v2'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getAuthenticatedUser } from '@/src/infrastructure/middleware/auth.middleware'
import { z } from 'zod'

// 요청 스키마 정의
const createReservationSchema = z.object({
  deviceId: z.string().uuid('올바른 기기 ID 형식이 아닙니다'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식(YYYY-MM-DD)을 입력해주세요'),
  startHour: z.number().int().min(0).max(29, '시작 시간은 0-29 사이여야 합니다'),
  endHour: z.number().int().min(1).max(30, '종료 시간은 1-30 사이여야 합니다'),
  userNotes: z.string().optional()
}).refine(data => data.startHour < data.endHour, {
  message: '종료 시간은 시작 시간보다 커야 합니다',
  path: ['endHour']
})

/**
 * 예약 생성 API (v2)
 * POST /api/v2/reservations/create
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
    const validationResult = createReservationSchema.safeParse(body)

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
    const deviceRepository = new SupabaseDeviceRepositoryV2(supabase)
    const userRepository = new UserSupabaseRepository(supabase)

    // 4. 유스케이스 실행
    const useCase = new CreateReservationV2UseCase(
      reservationRepository,
      deviceRepository,
      userRepository
    )

    const result = await useCase.execute({
      userId: user.id,
      deviceId: data.deviceId,
      date: data.date,
      startHour: data.startHour,
      endHour: data.endHour,
      userNotes: data.userNotes
    })

    // 5. 실시간 업데이트를 위한 브로드캐스트
    try {
      await supabase
        .channel('reservations')
        .send({
          type: 'broadcast',
          event: 'new_reservation',
          payload: { 
            date: data.date,
            deviceId: data.deviceId,
            reservationId: result.reservation.id,
            startHour: data.startHour,
            endHour: data.endHour
          }
        })
    } catch (broadcastError) {
      console.error('Broadcast error:', broadcastError)
      // 브로드캐스트 실패는 무시하고 계속 진행
    }

    // 6. 응답 반환
    return NextResponse.json({
      reservation: {
        id: result.reservation.id,
        userId: result.reservation.userId,
        deviceId: result.reservation.deviceId,
        date: result.reservation.date.dateString,
        timeSlot: {
          startHour: result.reservation.timeSlot.startHour,
          endHour: result.reservation.timeSlot.endHour,
          displayText: `${result.reservation.timeSlot.startHour}:00 - ${result.reservation.timeSlot.endHour}:00`
        },
        status: result.reservation.status.value,
        reservationNumber: result.reservation.reservationNumber,
        createdAt: result.reservation.createdAt.toISOString(),
        updatedAt: result.reservation.updatedAt.toISOString()
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Reservation creation error:', error)

    // 에러 타입에 따른 응답
    if (error instanceof Error) {
      // 비즈니스 로직 에러는 400으로 반환
      if (error.message.includes('예약') || 
          error.message.includes('권한') || 
          error.message.includes('시간') ||
          error.message.includes('기기') ||
          error.message.includes('사용자') ||
          error.message.includes('활성') ||
          error.message.includes('과거') ||
          error.message.includes('최대') ||
          error.message.includes('최소') ||
          error.message.includes('동시') ||
          error.message.includes('24시간')) {
        return NextResponse.json(
          { 
            error: 'Bad Request',
            message: error.message 
          },
          { status: 400 }
        )
      }

      // 리소스를 찾을 수 없는 경우
      if (error.message.includes('찾을 수 없습니다')) {
        return NextResponse.json(
          { 
            error: 'Not Found',
            message: error.message 
          },
          { status: 404 }
        )
      }
    }

    // 기본 에러 응답
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}