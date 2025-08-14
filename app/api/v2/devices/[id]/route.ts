import { NextRequest, NextResponse } from 'next/server'
import { UpdateDeviceUseCase } from '@/src/application/use-cases/device/update-device.use-case'
import { GetDeviceDetailUseCase } from '@/src/application/use-cases/device/get-device-detail.use-case'
import { DeviceSupabaseRepository } from '@/src/infrastructure/repositories/device.supabase.repository'
import { CheckInSupabaseRepository } from '@/src/infrastructure/repositories/checkin.supabase.repository'
import { SupabaseReservationRepositoryV2 } from '@/src/infrastructure/repositories/supabase-reservation.repository.v2'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { getAuthenticatedUser } from '@/src/infrastructure/middleware/auth.middleware'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * 기기 상세 조회 API
 * GET /api/v2/devices/{id}
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // params를 await로 추출
    const { id } = await params
    
    // 1. 서비스 초기화
    const supabase = createServiceRoleClient()
    const deviceRepository = new DeviceSupabaseRepository(supabase)
    const checkInRepository = new CheckInSupabaseRepository(supabase)
    const reservationRepository = new SupabaseReservationRepositoryV2(supabase)

    // 2. 유스케이스 실행
    const useCase = new GetDeviceDetailUseCase(
      deviceRepository as any,
      checkInRepository as any,
      reservationRepository as any
    )

    const result = await useCase.execute({
      deviceId: id
    })

    // 3. 응답 반환
    return NextResponse.json({
      device: {
        id: result.device.id,
        deviceNumber: result.device.deviceNumber,
        name: result.device.name,
        type: result.device.type,
        status: result.device.status,
        specifications: result.device.specifications,
        notes: result.device.notes,
        createdAt: result.device.createdAt.toISOString(),
        updatedAt: result.device.updatedAt.toISOString()
      },
      currentCheckIn: result.currentCheckIn,
      todayReservations: result.todayReservations,
      maintenanceHistory: result.maintenanceHistory
    }, { status: 200 })

  } catch (error) {
    console.error('Device detail error:', error)

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

/**
 * 기기 정보 수정 API
 * PUT /api/v2/devices/{id}
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // 3. 요청 본문 파싱
    const body = await request.json()
    const { name, specifications, notes } = body

    // 4. 서비스 초기화
    const supabase = createServiceRoleClient()
    const deviceRepository = new DeviceSupabaseRepository(supabase)
    const userRepository = new UserSupabaseRepository(supabase)

    // 5. 유스케이스 실행
    const useCase = new UpdateDeviceUseCase(deviceRepository as any, userRepository as any)
    const result = await useCase.execute({
      deviceId: id,
      name,
      specifications,
      notes,
      adminId: user.id
    } as any)

    // 6. 응답 반환
    return NextResponse.json({
      device: {
        id: result.device.id,
        deviceNumber: result.device.deviceNumber,
        name: (result.device as any).name,
        type: (result.device as any).type,
        status: (result.device as any).status,
        specifications: (result.device as any).specifications,
        notes: (result.device as any).notes,
        createdAt: (result.device as any).createdAt.toISOString(),
        updatedAt: (result.device as any).updatedAt.toISOString()
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Device update error:', error)

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
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}