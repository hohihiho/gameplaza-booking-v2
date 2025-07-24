import { NextRequest, NextResponse } from 'next/server'
import { GetCheckInDetailsUseCase } from '@/src/application/use-cases/checkin/get-checkin-details.use-case'
import { CheckInSupabaseRepository } from '@/src/infrastructure/repositories/checkin.supabase.repository'
import { ReservationSupabaseRepository } from '@/src/infrastructure/repositories/supabase-reservation.repository.v2'
import { DeviceSupabaseRepository } from '@/src/infrastructure/repositories/device.supabase.repository'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/src/infrastructure/middleware/auth.middleware'

/**
 * 체크인 상세 조회 API
 * GET /api/v2/checkins/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 인증 확인
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: '인증이 필요합니다' 
        },
        { status: 401 }
      )
    }

    // 2. 관리자 권한 확인
    if (user.role !== 'admin') {
      return NextResponse.json(
        { 
          error: 'Forbidden',
          message: '관리자 권한이 필요합니다' 
        },
        { status: 403 }
      )
    }

    // 3. 환경 변수 확인
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

    // 4. 서비스 초기화
    const supabase = createClient(supabaseUrl, supabaseKey)
    const checkInRepository = new CheckInSupabaseRepository(supabase)
    const reservationRepository = new ReservationSupabaseRepository(supabase)
    const deviceRepository = new DeviceSupabaseRepository(supabase)
    const userRepository = new UserSupabaseRepository(supabase)

    // 5. 유스케이스 실행
    const useCase = new GetCheckInDetailsUseCase(
      checkInRepository,
      reservationRepository,
      deviceRepository,
      userRepository
    )

    const result = await useCase.execute({
      checkInId: params.id
    })

    // 6. 응답 반환
    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('Get check-in details error:', error)

    // 에러 타입에 따른 응답
    if (error instanceof Error && error.message.includes('체크인 정보를 찾을 수 없습니다')) {
      return NextResponse.json(
        { 
          error: 'Not Found',
          message: error.message 
        },
        { status: 404 }
      )
    }

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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}