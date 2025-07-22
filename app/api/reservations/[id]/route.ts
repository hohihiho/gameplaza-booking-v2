import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { ReservationService } from '@/lib/services/reservation.service'
import { ScheduleService } from '@/lib/services/schedule.service'
import { 
  apiHandler, 
  parseRequestBody, 
  validateRequiredFields
} from '@/lib/api/handler'
import { 
  AppError, 
  ErrorCodes 
} from '@/lib/utils/error-handler'
import { logger } from '@/lib/utils/logger'

// 예약 상세 조회
export const GET = apiHandler(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  
  // 현재 사용자 확인
  const user = await getCurrentUser()
  if (!user) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, '로그인이 필요합니다', 401)
  }

  // 서비스 레이어 사용
  const supabase = createAdminClient()
  const reservationService = new ReservationService(supabase)

  // 예약 조회 (본인 것만)
  const reservation = await reservationService.getUserReservations(user.id, {
    status: 'all'
  })

  const targetReservation = reservation.reservations.find(r => r.id === id)
  
  if (!targetReservation) {
    throw new AppError(ErrorCodes.RESERVATION_NOT_FOUND, '예약을 찾을 수 없습니다', 404)
  }

  return { reservation: targetReservation }
}, { requireAuth: true })

// 예약 상태 업데이트
export const PATCH = apiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await parseRequestBody(req)
  
  // 현재 사용자 확인
  const user = await getCurrentUser()
  if (!user) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, '로그인이 필요합니다', 401)
  }

  // 필수 필드 검증
  validateRequiredFields(body, ['status'])

  // 서비스 레이어 사용
  const supabase = createAdminClient()
  const reservationService = new ReservationService(supabase)

  // 상태 업데이트 (본인 예약만 가능)
  const updated = await reservationService.updateReservationStatus(
    id,
    body.status,
    body.rejection_reason
  )

  return { 
    success: true,
    message: '예약 상태가 업데이트되었습니다',
    reservation: updated
  }
}, { requireAuth: true })

// 예약 취소
export const DELETE = apiHandler(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  
  // 현재 사용자 확인
  const user = await getCurrentUser()
  if (!user) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, '로그인이 필요합니다', 401)
  }

  // 서비스 레이어 사용
  const supabase = createAdminClient()
  const reservationService = new ReservationService(supabase)

  // 예약 조회
  const reservation = await reservationService.getUserReservations(user.id, {
    status: 'all'
  })

  const targetReservation = reservation.reservations.find(r => r.id === id)
  
  if (!targetReservation) {
    throw new AppError(ErrorCodes.RESERVATION_NOT_FOUND, '예약을 찾을 수 없습니다', 404)
  }

  // 취소 가능 여부 확인
  if (!['pending', 'approved'].includes(targetReservation.status)) {
    throw new AppError(ErrorCodes.INVALID_RESERVATION_STATUS, '취소할 수 없는 예약입니다', 400)
  }

  // 예약 시간 24시간 전까지만 취소 가능
  const reservationTime = new Date(`${targetReservation.date}T${targetReservation.start_time}`)
  const now = new Date()
  const hoursUntilReservation = (reservationTime.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntilReservation < 24) {
    throw new AppError(
      ErrorCodes.CANCELLATION_DEADLINE_PASSED, 
      '예약 시간 24시간 전까지만 취소 가능합니다',
      400
    )
  }

  // 예약 취소
  await reservationService.cancelReservation(id, user.id)

  // 자동 스케줄 삭제 검사
  try {
    await ScheduleService.checkAndDeleteAutoSchedules(targetReservation.date)
  } catch (scheduleError) {
    logger.error('Auto schedule deletion check error:', scheduleError)
    // 스케줄 삭제 실패는 무시하고 계속 진행
  }

  // 조기개장 스케줄 자동 조정
  try {
    const adjustResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/schedule/adjust-early-opening`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ date: targetReservation.date })
    })
    
    if (adjustResponse.ok) {
      const adjustResult = await adjustResponse.json()
      logger.info('조기개장 스케줄 조정 결과:', adjustResult)
    }
  } catch (adjustError) {
    logger.error('Early opening schedule adjustment error:', adjustError)
    // 스케줄 조정 실패는 무시하고 계속 진행
  }

  // 실시간 업데이트를 위한 브로드캐스트
  try {
    await supabase
      .channel('reservations')
      .send({
        type: 'broadcast',
        event: 'cancelled_reservation',
        payload: { 
          reservationId: id,
          deviceId: targetReservation.device_id,
          date: targetReservation.date,
          startTime: targetReservation.start_time,
          endTime: targetReservation.end_time
        }
      })
  } catch (broadcastError) {
    logger.error('Broadcast error:', broadcastError)
    // 브로드캐스트 실패는 무시하고 계속 진행
  }

  return { 
    success: true,
    message: '예약이 취소되었습니다'
  }
}, { requireAuth: true })