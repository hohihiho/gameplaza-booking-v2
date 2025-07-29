import { NextRequest, NextResponse } from 'next/server'
import { CreateDeviceUseCase } from '@/src/application/use-cases/device/create-device.use-case'
import { GetDeviceListUseCase } from '@/src/application/use-cases/device/get-device-list.use-case'
import { DeviceSupabaseRepository } from '@/src/infrastructure/repositories/device.supabase.repository'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
// DeviceTypeSupabaseRepository는 아직 구현되지 않음
import { getAuthenticatedUser } from '@/src/infrastructure/middleware/auth.middleware'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * 기기 목록 조회 API
 * GET /api/v2/devices
 */
export async function GET(request: NextRequest) {
  try {
    // 1. URL 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as any
    const type = searchParams.get('type') as any
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // 2. 서비스 초기화
    const supabase = createServiceRoleClient()
    const deviceRepository = new DeviceSupabaseRepository(supabase)

    // 3. 유스케이스 실행
    const useCase = new GetDeviceListUseCase(deviceRepository)
    const result = await useCase.execute({
      status,
      type,
      includeInactive
    })

    // 4. 응답 반환
    return NextResponse.json({
      devices: result.devices.map(device => ({
        id: device.id,
        deviceNumber: device.deviceNumber,
        name: device.name,
        type: device.type,
        status: device.status,
        specifications: device.specifications,
        notes: device.notes,
        createdAt: device.createdAt.toISOString(),
        updatedAt: device.updatedAt.toISOString()
      })),
      total: result.total
    }, { status: 200 })

  } catch (error) {
    console.error('Device list error:', error)

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
 * 기기 생성 API
 * POST /api/v2/devices
 */
export async function POST(request: NextRequest) {
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
    const { deviceNumber, name, type, notes } = body

    // 필수 필드 검증
    if (!deviceNumber || !name || !type) {
      return NextResponse.json(
        { 
          error: 'Bad Request',
          message: '기기 번호, 이름, 타입은 필수입니다' 
        },
        { status: 400 }
      )
    }

    // 4. 서비스 초기화
    const supabase = createServiceRoleClient()
    const deviceRepository = new DeviceSupabaseRepository(supabase)
    const userRepository = new UserSupabaseRepository(supabase)
    const deviceTypeRepository = deviceRepository as any

    // 5. 유스케이스 실행
    const useCase = new CreateDeviceUseCase(userRepository as any, deviceRepository as any, deviceTypeRepository)
    const result = await useCase.execute({
      userId: user.id,
      deviceTypeId: type,
      deviceNumber,
      notes
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
    }, { status: 201 })

  } catch (error) {
    console.error('Device creation error:', error)

    // 에러 타입에 따른 응답
    if (error instanceof Error) {
      if (error.message.includes('권한이 없습니다')) {
        return NextResponse.json(
          { 
            error: 'Forbidden',
            message: error.message 
          },
          { status: 403 }
        )
      }

      if (error.message.includes('이미 사용 중') || 
          error.message.includes('형식이 올바르지 않습니다')) {
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