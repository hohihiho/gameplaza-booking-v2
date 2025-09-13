import { NextRequest, NextResponse } from 'next/server'
import { ProcessCheckOutUseCase } from '@/application/use-cases/checkin/process-checkout.use-case'
import { CheckInSupabaseRepository } from '@/infrastructure/repositories/checkin.supabase.repository'
import { SupabaseReservationRepositoryV2 } from '@/infrastructure/repositories/supabase-reservation.repository.v2'
import { getAuthenticatedUser } from '@/infrastructure/middleware/auth.middleware'
import { createAdminClient } from '@/lib/db'
import { autoCheckDeviceStatus } from '@/lib/device-status-manager'

/**
 * 체크아웃 처리 API
 * PATCH /api/v2/checkins/[id]/checkout
 * 
 * Request Body:
 * {
 *   "notes"?: string
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔄 자동 기기 상태 체크 실행
    await autoCheckDeviceStatus()
    
    // params를 await로 추출
    const { id } = await params
    
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

    // 3. 요청 본문 파싱 (옵션)
    let notes: string | undefined
    try {
      const body = await request.json()
      notes = body.notes
    } catch {
      // 본문이 없거나 잘못된 경우 무시
      notes = undefined
    }

    // 4. 서비스 초기화
    import { getDB, supabase } from '@/lib/db';
    const checkInRepository = new CheckInSupabaseRepository(supabase)
    const reservationRepository = new SupabaseReservationRepositoryV2(supabase)

    // 5. 유스케이스 실행
    const useCase = new ProcessCheckOutUseCase(
      checkInRepository,
      reservationRepository
    )

    const result = await useCase.execute({
      checkInId: id,
      notes
    } as any)

    // 6. 응답 반환
    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('Checkout error:', error)

    // 에러 타입에 따른 응답
    if (error instanceof Error) {
      if (error.message.includes('체크인 정보를 찾을 수 없습니다')) {
        return NextResponse.json(
          { 
            error: 'Not Found',
            message: error.message 
          },
          { status: 404 }
        )
      }

      if (error.message.includes('사용 중인 체크인만 체크아웃할 수 있습니다') ||
          error.message.includes('결제가 완료되지 않은 체크인은 체크아웃할 수 없습니다')) {
        return NextResponse.json(
          { 
            error: 'Conflict',
            message: error.message 
          },
          { status: 409 }
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
      'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}