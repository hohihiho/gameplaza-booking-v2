import { NextRequest, NextResponse } from 'next/server'
import { ProcessCheckOutUseCase } from '@/src/application/use-cases/check-in/process-check-out.use-case'
import { CheckInSupabaseRepository } from '@/src/infrastructure/repositories/check-in.supabase.repository'
import { SupabaseReservationRepositoryV2 } from '@/src/infrastructure/repositories/supabase-reservation.repository.v2'
import { DeviceSupabaseRepository } from '@/src/infrastructure/repositories/device.supabase.repository'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/src/infrastructure/middleware/auth.middleware'

/**
 * 체크아웃 처리 API
 * POST /api/v2/check-ins/{id}/check-out
 */
export async function POST(
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

    // 3. 요청 본문 파싱
    const body = await request.json()
    const { notes } = body

    // 4. 환경 변수 확인
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

    // 5. 서비스 초기화
    const supabase = createClient(supabaseUrl, supabaseKey)
    const checkInRepository = new CheckInSupabaseRepository(supabase)
    const reservationRepository = new SupabaseReservationRepositoryV2(supabase)
    const deviceRepository = new DeviceSupabaseRepository(supabase)
    const userRepository = new UserSupabaseRepository(supabase)

    // 6. 유스케이스 실행
    const useCase = new ProcessCheckOutUseCase(
      checkInRepository,
      reservationRepository,
      deviceRepository,
      userRepository
    )

    const result = await useCase.execute({
      checkInId: params.id,
      adminId: user.id,
      notes
    })

    // 7. 응답 반환
    return NextResponse.json({
      checkIn: {
        id: result.checkIn.id,
        reservationId: result.checkIn.reservationId,
        userId: result.checkIn.userId,
        deviceId: result.checkIn.deviceId,
        checkInTime: result.checkIn.checkInTime.toISOString(),
        checkOutTime: result.checkIn.checkOutTime?.toISOString(),
        status: result.checkIn.status,
        checkInBy: result.checkIn.checkInBy,
        checkOutBy: result.checkIn.checkOutBy,
        notes: result.checkIn.notes,
        createdAt: result.checkIn.createdAt.toISOString(),
        updatedAt: result.checkIn.updatedAt.toISOString()
      },
      usageMinutes: result.usageMinutes
    }, { status: 200 })

  } catch (error) {
    console.error('Check-out process error:', error)

    // 에러 타입에 따른 응답
    if (error instanceof Error) {
      if (error.message.includes('찾을 수 없습니다')) {
        return NextResponse.json(
          { 
            error: 'Not Found',
            message: error.message 
          },
          { status: 404 }
        )
      }

      if (error.message.includes('권한이 없습니다')) {
        return NextResponse.json(
          { 
            error: 'Forbidden',
            message: error.message 
          },
          { status: 403 }
        )
      }

      if (error.message.includes('체크인 상태가 아닙니다') || 
          error.message.includes('체크아웃 시간')) {
        return NextResponse.json(
          { 
            error: 'Bad Request',
            message: error.message 
          },
          { status: 400 }
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