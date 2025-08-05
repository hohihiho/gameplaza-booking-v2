import { NextRequest, NextResponse } from 'next/server'
import { CreateReservationV2UseCase } from '@/src/application/use-cases/reservation/create-reservation.v2.use-case'
import { SupabaseReservationRepositoryV2 } from '@/src/infrastructure/repositories/supabase-reservation.repository.v2'
import { SupabaseDeviceRepositoryV2 } from '@/src/infrastructure/repositories/supabase-device.repository.v2'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

// 요청 스키마 정의
const createReservationSchema = z.object({
  deviceId: z.string().uuid('올바른 기기 ID 형식이 아닙니다'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식(YYYY-MM-DD)을 입력해주세요'),
  startHour: z.number().int().min(0).max(29, '시작 시간은 0-29 사이여야 합니다'),
  endHour: z.number().int().min(1).max(30, '종료 시간은 1-30 사이여야 합니다'),
  userNotes: z.string().optional(),
  onBehalfUserId: z.string().uuid().optional() // 대리 예약 대상 사용자 ID
}).refine(data => data.startHour < data.endHour, {
  message: '종료 시간은 시작 시간보다 커야 합니다',
  path: ['endHour']
})

/**
 * 예약 생성 API (v2)
 * POST /api/v2/reservations/create
 */
export async function POST(request: NextRequest) {
  console.log('=== Reservation Create API Called ===')
  console.log('Headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    // 0. Supabase 클라이언트 초기화
    const supabase = createServiceRoleClient()
    
    // 1. 인증 확인
    console.log('Checking authentication...')
    const user = await getCurrentUser()
    console.log('User from getCurrentUser:', user)
    
    if (!user) {
      console.log('No user found - returning 401')
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: '인증이 필요합니다' 
        },
        { status: 401 }
      )
    }
    
    console.log('Using user:', user)
    
    // 1-1. 관리자 권한 확인
    const isAdmin = user.role === 'admin'
    console.log('Is admin:', isAdmin)

    // 2. 요청 본문 파싱
    const body = await request.json()
    console.log('API v2 Request body:', body)
    
    const validationResult = createReservationSchema.safeParse(body)

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      console.log('Validation error:', {
        body,
        errors: validationResult.error.errors,
        firstError
      })
      
      const detailedMessage = validationResult.error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join(', ')
        
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: `입력값 검증 실패: ${detailedMessage}`,
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const data = validationResult.data
    
    // 2-1. 대리 예약 권한 확인
    if (data.onBehalfUserId && !isAdmin) {
      return NextResponse.json(
        { 
          error: 'Forbidden',
          message: '대리 예약은 관리자만 가능합니다' 
        },
        { status: 403 }
      )
    }
    
    // 대리 예약인 경우 대상 사용자 ID 사용
    const targetUserId = data.onBehalfUserId || user.id
    console.log('Target user ID:', targetUserId, 'On behalf mode:', !!data.onBehalfUserId)

    // 3. 서비스 초기화 (supabase는 이미 위에서 초기화됨)
    const reservationRepository = new SupabaseReservationRepositoryV2(supabase)
    const deviceRepository = new SupabaseDeviceRepositoryV2(supabase)
    const userRepository = new UserSupabaseRepository(supabase)

    // 4. 유스케이스 실행
    const useCase = new CreateReservationV2UseCase(
      reservationRepository,
      deviceRepository,
      userRepository
    )

    console.log('About to execute use case with:', {
      userId: targetUserId,
      deviceId: data.deviceId,
      date: data.date,
      startHour: data.startHour,
      endHour: data.endHour,
      userNotes: data.userNotes,
      isAdmin: isAdmin,
      createdByUserId: user.id // 실제 예약 생성자
    })

    const result = await useCase.execute({
      userId: targetUserId,
      deviceId: data.deviceId,
      date: data.date,
      startHour: data.startHour,
      endHour: data.endHour,
      userNotes: data.userNotes,
      isAdmin: isAdmin, // 관리자 여부 전달
      createdByUserId: user.id // 실제 예약 생성자 ID
    })

    console.log('Use case executed successfully:', result.reservation.id)

    // 5. 실시간 업데이트를 위한 브로드캐스트
    try {
      // 기기 타입 정보 조회
      const { data: deviceData } = await supabase
        .from('devices')
        .select('device_type_id, device_number')
        .eq('id', data.deviceId)
        .single()
      
      await supabase
        .channel('reservations')
        .send({
          type: 'broadcast',
          event: 'new_reservation',
          payload: { 
            date: data.date,
            deviceId: data.deviceId,
            deviceTypeId: deviceData?.device_type_id,
            deviceNumber: deviceData?.device_number,
            reservationId: result.reservation.id,
            startHour: data.startHour,
            endHour: data.endHour,
            status: 'pending' // 예약 대기 상태
          }
        })
      
      console.log('Broadcast sent:', {
        deviceTypeId: deviceData?.device_type_id,
        deviceNumber: deviceData?.device_number,
        date: data.date,
        timeSlot: `${data.startHour}-${data.endHour}`
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
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown')
    console.error('Error message:', error instanceof Error ? error.message : error)

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