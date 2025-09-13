import { NextRequest, NextResponse } from 'next/server'
import { CancelReservationUseCase } from '@/src/application/use-cases/reservation/cancel-reservation.use-case'
import { SupabaseReservationRepositoryV2 } from '@/src/infrastructure/repositories/supabase-reservation.repository.v2'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { createAdminClient } from '@/lib/db'
import { getAuthenticatedUser } from '@/src/infrastructure/middleware/auth.middleware'

/**
 * 예약 취소 API
 * POST /api/v2/reservations/{id}/cancel
 */
export async function POST(
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

    // 2. 요청 본문 파싱 (취소 사유는 선택사항)
    let reason: string | undefined
    try {
      const body = await request.json()
      reason = body.reason
    } catch {
      // 본문이 없는 경우 무시
    }

    // 3. 서비스 초기화
    const supabase = createAdminClient()
    const reservationRepository = new SupabaseReservationRepositoryV2(supabase)
    const userRepository = new UserSupabaseRepository(supabase)

    // 4. 유스케이스 실행
    const useCase = new CancelReservationUseCase(
      reservationRepository as any,
      userRepository as any
    )

    const result = await useCase.execute({
      reservationId: id,
      userId: user.id,
      reason
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
        reservationNumber: result.reservation.reservationNumber,
        createdAt: result.reservation.createdAt.toISOString(),
        updatedAt: result.reservation.updatedAt.toISOString()
      },
      reason
    }, { status: 200 })

  } catch (error) {
    console.error('Reservation cancellation error:', error)

    // 에러 타입에 따른 응답
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

      if (error.message.includes('취소할 수 없') || 
          error.message.includes('활성 상태가 아닌') ||
          error.message.includes('체크인된') ||
          error.message.includes('2시간 전')) {
        return NextResponse.json(
          { 
            error: 'Bad Request',
            message: error.message 
          },
          { status: 400 }
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