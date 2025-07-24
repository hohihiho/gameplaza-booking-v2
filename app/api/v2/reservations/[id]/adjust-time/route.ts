import { NextRequest, NextResponse } from 'next/server'
import { createResponse, ErrorResponse } from '@/lib/api/response'
import { withAuth } from '@/lib/api/auth-middleware'
import { AuthenticatedRequest } from '@/lib/api/types'
import { UserRole } from '@/src/domain/value-objects/user-role'
import { AdjustReservationTimeUseCase } from '@/src/application/use-cases/reservation/adjust-time.use-case'
import { UserRepository } from '@/src/infrastructure/repositories/supabase/user.repository'
import { ReservationRepository } from '@/src/infrastructure/repositories/supabase/reservation.repository'
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
      
      // 관리자 권한 확인
      const userRole = new UserRole(user.role as any)
      if (userRole.value !== 'admin') {
        return createResponse(
          new ErrorResponse('관리자 권한이 필요합니다', 'FORBIDDEN'),
          403
        )
      }

      // 요청 데이터 파싱
      const body = await req.json()
      const { actualStartTime, actualEndTime, reason, reasonDetail } = body

      // 필수 필드 검증
      if (!actualStartTime || !actualEndTime || !reason) {
        return createResponse(
          new ErrorResponse('필수 정보가 누락되었습니다', 'VALIDATION_ERROR'),
          400
        )
      }

      // 시간 조정 사유 유효성 검증
      const validReasons = ['admin_late', 'system_error', 'customer_extend', 'early_finish', 'other']
      if (!validReasons.includes(reason)) {
        return createResponse(
          new ErrorResponse('유효하지 않은 조정 사유입니다', 'VALIDATION_ERROR'),
          400
        )
      }

      // Supabase 클라이언트 생성
      const supabase = await createClient()
      
      // 리포지토리 초기화
      const userRepository = new UserRepository(supabase)
      const reservationRepository = new ReservationRepository(supabase)
      const paymentRepository = new PaymentRepository(supabase)
      const notificationRepository = new NotificationRepository(supabase)

      // Use Case 실행
      const useCase = new AdjustReservationTimeUseCase(
        userRepository,
        reservationRepository,
        paymentRepository,
        notificationRepository
      )

      const result = await useCase.execute({
        userId: user.id,
        reservationId: params.id,
        actualStartTime,
        actualEndTime,
        reason,
        reasonDetail
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
            actualEndTime: result.reservation.actualEndTime,
            createdAt: result.reservation.createdAt,
            updatedAt: result.reservation.updatedAt
          },
          timeAdjustment: {
            originalStartTime: result.timeAdjustment.originalStartTime,
            originalEndTime: result.timeAdjustment.originalEndTime,
            actualStartTime: result.timeAdjustment.actualStartTime,
            actualEndTime: result.timeAdjustment.actualEndTime,
            originalDurationMinutes: result.timeAdjustment.originalDurationMinutes,
            actualDurationMinutes: result.timeAdjustment.actualDurationMinutes,
            adjustmentMinutes: result.timeAdjustment.adjustmentMinutes,
            chargeableMinutes: result.timeAdjustment.chargeableMinutes,
            reason: result.timeAdjustment.reason,
            reasonText: result.timeAdjustment.reasonText,
            reasonDetail: result.timeAdjustment.reasonDetail,
            adjustedBy: result.timeAdjustment.adjustedBy,
            adjustedAt: result.timeAdjustment.adjustedAt
          },
          originalAmount: result.originalAmount,
          adjustedAmount: result.adjustedAmount,
          message: result.message
        }
      })
    } catch (error) {
      console.error('Adjust reservation time error:', error)
      
      if (error instanceof Error) {
        return createResponse(
          new ErrorResponse(error.message, 'ADJUST_TIME_ERROR'),
          400
        )
      }
      
      return createResponse(
        new ErrorResponse('시간 조정 중 오류가 발생했습니다', 'INTERNAL_ERROR'),
        500
      )
    }
  })(req)
}