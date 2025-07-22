import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { ReservationService } from '@/lib/services/reservation.service'
import { UserService } from '@/lib/services/user.service'
import { 
  apiHandler, 
  parseRequestBody, 
  validateRequiredFields,
  validateDateFormat,
  validateTimeFormat,
  parseSearchParams,
  parsePaginationParams
} from '@/lib/api/handler'
import { 
  AppError, 
  ErrorCodes 
} from '@/lib/utils/error-handler'
import { logger } from '@/lib/utils/logger'

// 예약 생성
export const POST = apiHandler(async (req: NextRequest) => {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, '로그인이 필요합니다', 401)
  }

  const body = await parseRequestBody(req)
  logger.info('예약 요청 데이터:', body)
  
  const { 
    date,
    startTime,
    start_time,
    endTime,
    end_time,
    deviceId,
    device_id,
    playerCount,
    player_count,
    hourlyRate,
    totalAmount,
    total_amount,
    userNotes,
    user_notes,
    creditType,
    credit_type
  } = body
  
  // 필드 이름 통일 (snake_case 우선)
  const reservationData = {
    date: validateDateFormat(date),
    startTime: validateTimeFormat(start_time || startTime),
    endTime: validateTimeFormat(end_time || endTime),
    deviceId: device_id || deviceId,
    playerCount: player_count || playerCount || 1,
    totalAmount: total_amount || totalAmount,
    userNotes: user_notes || userNotes,
    creditType: credit_type || creditType || 'freeplay',
    hourlyRate: hourlyRate || total_amount || totalAmount || 0
  }
  
  // 필수 필드 검증
  validateRequiredFields(reservationData, ['date', 'startTime', 'endTime', 'deviceId'])

  // 서비스 레이어 사용
  const supabase = createAdminClient()
  const reservationService = new ReservationService(supabase)
  const userService = new UserService(supabase)

  // 사용자 정보 확인/생성
  await userService.createOrUpdateUser({
    id: user.id,
    email: user.email!,
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User'
  })

  // 예약 생성
  const result = await reservationService.createReservation(user.id, reservationData)

  // 실시간 업데이트를 위한 브로드캐스트
  try {
    await supabase
      .channel('reservations')
      .send({
        type: 'broadcast',
        event: 'new_reservation',
        payload: { 
          date: reservationData.date,
          deviceId: reservationData.deviceId,
          reservationId: result.reservation?.id,
          startTime: reservationData.startTime,
          endTime: reservationData.endTime
        }
      })
  } catch (broadcastError) {
    logger.error('Broadcast error:', broadcastError)
    // 브로드캐스트 실패는 무시하고 계속 진행
  }

  return result
}, { requireAuth: true })

// 내 예약 목록 조회
export const GET = apiHandler(async (req: NextRequest) => {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, '로그인이 필요합니다', 401)
  }

  // 쿼리 파라미터 파싱
  const searchParams = parseSearchParams(req)
  const status = searchParams.get('status')
  const { page, pageSize } = parsePaginationParams(req)

  // 서비스 레이어 사용
  const supabase = createAdminClient()
  const reservationService = new ReservationService(supabase)

  // 예약 목록 조회
  const result = await reservationService.getUserReservations(user.id, {
    status: status || undefined,
    page,
    pageSize
  })

  return result
}, { requireAuth: true })