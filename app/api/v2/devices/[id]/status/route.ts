import { NextRequest, NextResponse } from 'next/server'
import { ChangeDeviceStatusUseCase } from '@/src/application/use-cases/device/change-device-status.use-case'
import { DeviceSupabaseRepository } from '@/src/infrastructure/repositories/device.supabase.repository'
import { CheckInSupabaseRepository } from '@/src/infrastructure/repositories/check-in.supabase.repository'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/src/infrastructure/middleware/auth.middleware'

/**
 * 기기 상태 변경 API
 * PUT /api/v2/devices/{id}/status
 */
export async function PUT(
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
    const { status, reason } = body

    if (!status) {
      return NextResponse.json(
        { 
          error: 'Bad Request',
          message: '상태값이 필요합니다' 
        },
        { status: 400 }
      )
    }

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
    const deviceRepository = new DeviceSupabaseRepository(supabase)
    const userRepository = new UserSupabaseRepository(supabase)
    const checkInRepository = new CheckInSupabaseRepository(supabase)

    // 6. 유스케이스 실행
    const useCase = new ChangeDeviceStatusUseCase(
      deviceRepository,
      userRepository,
      checkInRepository
    )

    const result = await useCase.execute({
      deviceId: params.id,
      newStatus: status,
      reason,
      adminId: user.id
    })

    // 7. 응답 반환
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
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Device status change error:', error)

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

      if (error.message.includes('이미') || 
          error.message.includes('체크아웃 후') ||
          error.message.includes('사유를 입력') ||
          error.message.includes('활성화해야') ||
          error.message.includes('체크인 시스템')) {
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
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}