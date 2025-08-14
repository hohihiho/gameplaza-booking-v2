import { NextRequest, NextResponse } from 'next/server'
import { createResponse, ErrorResponse } from '@/lib/api/response'
import { withAuth } from '@/lib/auth'
import { ExtendedUser } from '@/lib/auth/types'
import { CheckInReservationUseCase } from '@/src/application/use-cases/reservation/check-in.use-case'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { SupabaseReservationRepository } from '@/src/infrastructure/repositories/supabase-reservation.repository'
import { DeviceSupabaseRepository } from '@/src/infrastructure/repositories/device.supabase.repository'
import { PaymentSupabaseRepository } from '@/src/infrastructure/repositories/payment.supabase.repository'
import { NotificationSupabaseRepository } from '@/src/infrastructure/repositories/notification.supabase.repository'
import { CheckInSupabaseRepository } from '@/src/infrastructure/repositories/check-in.supabase.repository'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return withAuth(async (req: NextRequest, { user }: { user: ExtendedUser }) => {
    try {
      // params를 await로 추출
      const { id } = await params
      
      // 관리자 또는 스태프 권한 확인
      if (!user.role || user.role === 'user') {
        return createResponse(
          new ErrorResponse('권한이 없습니다', 'FORBIDDEN'),
          403
        )
      }

      // 요청 데이터 파싱
      const body = await req.json()
      const { paymentMethod, paymentAmount } = body

      // Supabase 클라이언트 생성
      const supabase = createServiceRoleClient()
      
      // 리포지토리 초기화
      const userRepository = new UserSupabaseRepository(supabase)
      const reservationRepository = new SupabaseReservationRepository(supabase)
      const deviceRepository = new DeviceSupabaseRepository(supabase)
      const paymentRepository = new PaymentSupabaseRepository(supabase)
      const notificationRepository = new NotificationSupabaseRepository(supabase)
      const checkInRepository = new CheckInSupabaseRepository(supabase)

      // Use Case 실행
      const useCase = new CheckInReservationUseCase(
        userRepository,
        reservationRepository,
        deviceRepository as any,
        paymentRepository,
        notificationRepository,
        checkInRepository as any
      )

      const result = await useCase.execute({
        userId: user.id,
        reservationId: id,
        paymentMethod,
        paymentAmount
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
              displayText: result.reservation.timeSlot.displayTime
            },
            status: result.reservation.status.value,
            reservationNumber: result.reservation.reservationNumber,
            assignedDeviceNumber: result.reservation.assignedDeviceNumber,
            checkedInAt: result.reservation.checkedInAt,
            actualStartTime: result.reservation.actualStartTime,
            createdAt: result.reservation.createdAt,
            updatedAt: result.reservation.updatedAt
          },
          checkIn: {
            id: result.checkIn.id,
            checkInTime: result.checkIn.checkInTime.toISOString(),
            status: result.checkIn.status,
            paymentAmount: result.checkIn.paymentAmount,
            paymentMethod: result.checkIn.paymentMethod
          },
          payment: result.payment ? {
            id: result.payment.id,
            amount: result.payment.amount,
            method: result.payment.method,
            status: result.payment.status
          } : undefined,
          assignedDevice: result.assignedDevice,
          message: result.message
        }
      })
    } catch (error) {
      console.error('Check-in reservation error:', error)
      
      if (error instanceof Error) {
        return createResponse(
          new ErrorResponse(error.message, 'VALIDATION_ERROR'),
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