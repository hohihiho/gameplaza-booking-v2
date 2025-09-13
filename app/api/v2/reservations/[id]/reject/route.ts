import { NextRequest, NextResponse } from 'next/server'
import { createApiHandler } from '@/lib/api/handler'
import { RejectReservationUseCase } from '@/application/use-cases/reservation/reject-reservation.use-case'
import { UserSupabaseRepository } from '@/infrastructure/repositories/user.supabase.repository'
import { SupabaseReservationRepositoryV2 } from '@/infrastructure/repositories/supabase-reservation.repository.v2'
import { NotificationSupabaseRepository } from '@/infrastructure/repositories/notification.supabase.repository'
import { createAdminClient } from '@/lib/db'
import { getAuthenticatedUser, isAdmin } from '@/infrastructure/middleware/auth.middleware'

interface RejectRequestBody {
  reason: string
}

export const POST = createApiHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const reservationId = params.id
    
    // 인증 확인
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { message: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 관리자 권한 확인
    if (!isAdmin(user)) {
      return NextResponse.json(
        { message: '관리자 권한이 필요합니다' },
        { status: 401 }
      )
    }

    try {
      // 요청 본문 파싱
      const body = await request.json() as RejectRequestBody
      
      if (!body.reason || body.reason.trim().length === 0) {
        return NextResponse.json(
          { error: '거절 사유를 입력해주세요' },
          { status: 400 }
        )
      }

      // Supabase 클라이언트 생성
      import { getDB, supabase } from '@/lib/db';

      // 리포지토리 생성
      const userRepository = new UserSupabaseRepository(supabase)
      const reservationRepository = new SupabaseReservationRepositoryV2(supabase)
      const notificationRepository = new NotificationSupabaseRepository(supabase)

      // 유스케이스 실행
      const useCase = new RejectReservationUseCase(
        userRepository,
        reservationRepository,
        notificationRepository
      )

      const result = await useCase.execute({
        userId: user.id,
        reservationId: reservationId,
        reason: body.reason
      })

      return NextResponse.json({
        id: result.reservation.id,
        reservationNumber: result.reservation.reservationNumber,
        status: result.reservation.status.value,
        admin_notes: result.reservation.rejectionReason,
        rejectionReason: result.reservation.rejectionReason,
        date: result.reservation.date.dateString,
        timeSlot: {
          startHour: result.reservation.timeSlot.startHour,
          endHour: result.reservation.timeSlot.endHour
        }
      })
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: '예약 거절 중 오류가 발생했습니다' },
        { status: 500 }
      )
    }
  }
)