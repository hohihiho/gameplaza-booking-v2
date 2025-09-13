import { NextRequest, NextResponse } from 'next/server'
import { createApiHandler } from '@/lib/api/handler'
import { ApproveReservationUseCase } from '@/application/use-cases/reservation/approve-reservation.use-case'
import { UserSupabaseRepository } from '@/infrastructure/repositories/user.supabase.repository'
import { SupabaseReservationRepositoryV2 } from '@/infrastructure/repositories/supabase-reservation.repository.v2'
import { SupabaseDeviceRepositoryV2 } from '@/infrastructure/repositories/supabase-device.repository.v2'
import { NotificationSupabaseRepository } from '@/infrastructure/repositories/notification.supabase.repository'
import { createAdminClient } from '@/lib/db'
import { getAuthenticatedUser, isAdmin } from '@/infrastructure/middleware/auth.middleware'

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
      // Supabase 클라이언트 생성
      import { getDB, supabase } from '@/lib/db';

      // 리포지토리 생성
      const userRepository = new UserSupabaseRepository(supabase)
      const reservationRepository = new SupabaseReservationRepositoryV2(supabase)
      const deviceRepository = new SupabaseDeviceRepositoryV2(supabase)
      const notificationRepository = new NotificationSupabaseRepository(supabase)

      // 유스케이스 실행
      const useCase = new ApproveReservationUseCase(
        userRepository as any,
        reservationRepository as any,
        deviceRepository as any,
        notificationRepository as any
      )

      const result = await useCase.execute({
        userId: user.id,
        reservationId: reservationId
      })

      return NextResponse.json({
        success: true,
        reservation: {
          id: result.reservation.id,
          reservationNumber: result.reservation.reservationNumber,
          status: result.reservation.status.value,
          assignedDeviceNumber: result.assignedDeviceNumber,
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
        { error: '예약 승인 중 오류가 발생했습니다' },
        { status: 500 }
      )
    }
  }
)