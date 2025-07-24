import { NextRequest, NextResponse } from 'next/server'
import { CreateReservationRemindersUseCase } from '@/src/application/use-cases/notification/send-reservation-notification.use-case'
import { SupabaseNotificationRepository } from '@/src/infrastructure/repositories/supabase-notification.repository'
import { SupabaseReservationRepositoryV2 } from '@/src/infrastructure/repositories/supabase-reservation.repository.v2'
import { SupabaseDeviceRepositoryV2 } from '@/src/infrastructure/repositories/supabase-device.repository.v2'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { createClient } from '@supabase/supabase-js'

/**
 * 예약 리마인더 생성 크론 작업
 * GET /api/v2/cron/reservation-reminders
 * 
 * 매일 실행되어 다음날 예약에 대한 리마인더 알림을 생성합니다.
 * Vercel Cron 또는 외부 크론 서비스에서 호출됩니다.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 크론 작업 인증 확인 (Vercel Cron Secret)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: '유효하지 않은 크론 시크릿입니다' 
        },
        { status: 401 }
      )
    }

    // 2. 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing required environment variables')
      return NextResponse.json(
        { 
          error: 'Internal Server Error',
          message: '서버 설정 오류' 
        },
        { status: 500 }
      )
    }

    // 3. 서비스 초기화
    const supabase = createClient(supabaseUrl, supabaseKey)
    const notificationRepository = new SupabaseNotificationRepository(supabase)
    const reservationRepository = new SupabaseReservationRepositoryV2(supabase)
    const deviceRepository = new SupabaseDeviceRepositoryV2(supabase)
    const userRepository = new UserSupabaseRepository(supabase)

    // 4. 유스케이스 실행
    const useCase = new CreateReservationRemindersUseCase(
      notificationRepository,
      reservationRepository,
      deviceRepository,
      userRepository
    )

    const startTime = Date.now()
    const result = await useCase.execute()
    const executionTime = Date.now() - startTime

    // 5. 로그 기록
    console.log({
      job: 'reservation-reminders',
      created: result.created,
      executionTime: `${executionTime}ms`,
      timestamp: new Date().toISOString()
    })

    // 6. 응답 반환
    return NextResponse.json({
      success: true,
      created: result.created,
      message: `${result.created}개의 예약 리마인더가 생성되었습니다`,
      executionTime: `${executionTime}ms`
    }, { status: 200 })

  } catch (error) {
    console.error('Reservation reminders cron error:', error)

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: '예약 리마인더 생성 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : 'Unknown error'
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}