import { NextRequest, NextResponse } from 'next/server'
import { ProcessCheckInUseCase } from '@/src/application/use-cases/checkin/process-checkin.use-case'
import { GetActiveCheckInsUseCase } from '@/src/application/use-cases/checkin/get-active-checkins.use-case'
import { CheckInSupabaseRepository } from '@/src/infrastructure/repositories/checkin.supabase.repository'
import { DeviceSupabaseRepository } from '@/src/infrastructure/repositories/device.supabase.repository'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { SupabaseReservationRepositoryV2 } from '@/src/infrastructure/repositories/supabase-reservation.repository.v2'
import { getAuthenticatedUser } from '@/src/infrastructure/middleware/auth.middleware'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { autoCheckDeviceStatus } from '@/lib/device-status-manager'

/**
 * 활성 체크인 목록 조회 API
 * GET /api/v2/checkins
 * 
 * Query Parameters:
 * - deviceId?: string - 특정 기기의 체크인만 조회
 * - includeWaitingPayment?: boolean - 결제 대기 중인 체크인 포함 여부
 */
export async function GET(request: NextRequest) {
  try {
    // 🔄 자동 기기 상태 체크 실행
    await autoCheckDeviceStatus()
    
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

    // 3. URL 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId') || undefined
    const includeWaitingPayment = searchParams.get('includeWaitingPayment') === 'true'

    // 4. 서비스 초기화
    const supabase = createServiceRoleClient()
    const checkInRepository = new CheckInSupabaseRepository(supabase)
    const reservationRepository = new SupabaseReservationRepositoryV2(supabase)
    const deviceRepository = new DeviceSupabaseRepository(supabase)
    const userRepository = new UserSupabaseRepository(supabase)

    // 5. 유스케이스 실행
    const useCase = new GetActiveCheckInsUseCase(
      checkInRepository,
      reservationRepository,
      deviceRepository,
      userRepository
    )

    const result = await useCase.execute({
      deviceId,
      includeWaitingPayment
    })

    // 6. 응답 반환
    return NextResponse.json(result.data, { status: 200 })

  } catch (error) {
    console.error('Get active check-ins error:', error)

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: '서버 오류가 발생했습니다' 
      },
      { status: 500 }
    )
  }
}

/**
 * 체크인 생성 API
 * POST /api/v2/checkins
 * 
 * Request Body:
 * {
 *   "reservationId": "string",
 *   "deviceId": "string",
 *   "adminId": "string"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 🔄 자동 기기 상태 체크 실행
    await autoCheckDeviceStatus()
    
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

    // 3. 요청 본문 파싱
    const body = await request.json()
    const { reservationId, deviceId } = body

    // 필수 필드 검증
    if (!reservationId || !deviceId) {
      return NextResponse.json(
        { 
          error: 'Bad Request',
          message: '예약 ID와 기기 ID는 필수입니다' 
        },
        { status: 400 }
      )
    }

    // 4. 서비스 초기화
    const supabase = createServiceRoleClient()
    const checkInRepository = new CheckInSupabaseRepository(supabase)
    const reservationRepository = new SupabaseReservationRepositoryV2(supabase)
    const deviceRepository = new DeviceSupabaseRepository(supabase)

    // 5. 유스케이스 실행
    const useCase = new ProcessCheckInUseCase(
      checkInRepository as any,
      reservationRepository as any,
      deviceRepository,
      deviceRepository as any // deviceTypeRepository 대신 임시로 사용
    )

    const result = await useCase.execute({
      reservationId,
      deviceId
    } as any)

    // 6. 응답 반환
    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    console.error('Check-in creation error:', error)

    // 에러 타입에 따른 응답
    if (error instanceof Error) {
      if (error.message.includes('예약을 찾을 수 없습니다') ||
          error.message.includes('기기를 찾을 수 없습니다')) {
        return NextResponse.json(
          { 
            error: 'Not Found',
            message: error.message 
          },
          { status: 404 }
        )
      }

      if (error.message.includes('체크인할 수 없는 상태') ||
          error.message.includes('사용할 수 없는 상태') ||
          error.message.includes('이미 활성화된 체크인')) {
        return NextResponse.json(
          { 
            error: 'Conflict',
            message: error.message 
          },
          { status: 409 }
        )
      }

      if (error.message.includes('체크인 가능 시간')) {
        return NextResponse.json(
          { 
            error: 'Bad Request',
            message: error.message 
          },
          { status: 400 }
        )
      }
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}