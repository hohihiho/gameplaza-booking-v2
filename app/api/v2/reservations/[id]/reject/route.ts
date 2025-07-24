import { NextRequest, NextResponse } from 'next/server'
import { createApiHandler } from '@/lib/api/handler'
import { RejectReservationUseCase } from '@/src/application/use-cases/reservation/reject-reservation.use-case'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { SupabaseReservationRepositoryV2 } from '@/src/infrastructure/repositories/supabase-reservation.repository.v2'
import { SupabaseNotificationRepository } from '@/src/infrastructure/repositories/supabase-notification.repository'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface RejectRequestBody {
  reason: string
}

export const POST = createApiHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const reservationId = params.id
    
    // 인증 확인
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    try {
      // 요청 본문 파싱
      const body = await request.json() as RejectRequestBody
      
      if (!body.reason || body.reason.trim().length === 0) {
        return NextResponse.json(
          { error: '거절 사유는 필수입니다' },
          { status: 400 }
        )
      }

      // Supabase 클라이언트 생성
      const supabase = createServerSupabaseClient()
      
      // 현재 사용자 정보 가져오기
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return NextResponse.json(
          { error: '인증 정보가 유효하지 않습니다' },
          { status: 401 }
        )
      }

      // 리포지토리 생성
      const userRepository = new UserSupabaseRepository(supabase)
      const reservationRepository = new SupabaseReservationRepositoryV2(supabase)
      const notificationRepository = new SupabaseNotificationRepository(supabase)

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
        success: true,
        reservation: {
          id: result.reservation.id,
          reservationNumber: result.reservation.reservationNumber,
          status: result.reservation.status.value,
          rejectionReason: result.reservation.rejectionReason,
          date: result.reservation.date.dateString,
          timeSlot: {
            startHour: result.reservation.timeSlot.startHour,
            endHour: result.reservation.timeSlot.endHour
          }
        },
        message: result.message
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