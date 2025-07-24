import { NextRequest, NextResponse } from 'next/server'
import { createResponse, ErrorResponse } from '@/lib/api/response'
import { withAuth } from '@/lib/api/auth-middleware'
import { AuthenticatedRequest } from '@/lib/api/types'
import { UserRole } from '@/src/domain/value-objects/user-role'
import { CheckInReservationUseCase } from '@/src/application/use-cases/reservation/check-in.use-case'
import { UserRepository } from '@/src/infrastructure/repositories/supabase/user.repository'
import { ReservationRepository } from '@/src/infrastructure/repositories/supabase/reservation.repository'
import { DeviceRepository } from '@/src/infrastructure/repositories/supabase/device.repository'
import { PaymentRepository } from '@/src/infrastructure/repositories/supabase/payment.repository'
import { NotificationRepository } from '@/src/infrastructure/repositories/supabase/notification.repository'
import { createClient } from '@/utils/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return withAuth(async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const { user } = authenticatedReq
      
      // 관리자 또는 스태프 권한 확인
      const userRole = new UserRole(user.role as any)
      if (!userRole.canManageReservations()) {
        return createResponse(
          new ErrorResponse('권한이 없습니다', 'FORBIDDEN'),
          403
        )
      }

      // 요청 데이터 파싱
      const body = await req.json()
      const { paymentMethod } = body

      // Supabase 클라이언트 생성
      const supabase = await createClient()
      
      // 리포지토리 초기화
      const userRepository = new UserRepository(supabase)
      const reservationRepository = new ReservationRepository(supabase)
      const deviceRepository = new DeviceRepository(supabase)
      const paymentRepository = new PaymentRepository(supabase)
      const notificationRepository = new NotificationRepository(supabase)

      // Use Case 실행
      const useCase = new CheckInReservationUseCase(
        userRepository,
        reservationRepository,
        deviceRepository,
        paymentRepository,
        notificationRepository
      )

      const result = await useCase.execute({
        userId: user.id,
        reservationId: params.id,
        paymentMethod
      })

      return createResponse({
        success: true,
        data: {
          reservation: {
            id: result.reservation.id,
            userId: result.reservation.userId,
            deviceId: result.reservation.deviceId,
            date: result.reservation.date.dateString,
            timeSlot: {
              startHour: result.reservation.timeSlot.startHour,
              endHour: result.reservation.timeSlot.endHour,
              displayText: result.reservation.timeSlot.displayText
            },
            status: result.reservation.status.value,
            reservationNumber: result.reservation.reservationNumber,
            assignedDeviceNumber: result.reservation.assignedDeviceNumber,
            checkedInAt: result.reservation.checkedInAt,
            actualStartTime: result.reservation.actualStartTime,
            createdAt: result.reservation.createdAt,
            updatedAt: result.reservation.updatedAt
          },
          payment: result.payment ? {
            id: result.payment.id,
            amount: result.payment.amount,
            method: result.payment.method,
            status: result.payment.status.value
          } : undefined,
          assignedDevice: result.assignedDevice,
          message: result.message
        }
      })
    } catch (error) {
      console.error('Check-in reservation error:', error)
      
      if (error instanceof Error) {
        return createResponse(
          new ErrorResponse(error.message, 'CHECK_IN_ERROR'),
          400
        )
      }
      
      return createResponse(
        new ErrorResponse('체크인 처리 중 오류가 발생했습니다', 'INTERNAL_ERROR'),
        500
      )
    }
  })(req)
}