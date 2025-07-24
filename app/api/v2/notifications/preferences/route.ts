import { NextRequest, NextResponse } from 'next/server'
import { 
  GetNotificationPreferencesUseCase,
  UpdateNotificationPreferencesUseCase 
} from '@/src/application/use-cases/notification/manage-notifications.use-case'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/src/infrastructure/middleware/auth.middleware'
import { z } from 'zod'

// PUT 요청 바디 스키마
const updatePreferencesSchema = z.object({
  type: z.enum([
    'reservation_created',
    'reservation_approved',
    'reservation_rejected',
    'reservation_cancelled',
    'reservation_reminder',
    'check_in_reminder',
    'no_show_warning',
    'system_announcement',
    'maintenance_notice'
  ]),
  channels: z.array(z.enum(['push', 'email', 'sms', 'in_app'])).optional(),
  enabled: z.boolean().optional()
})

/**
 * 알림 설정 조회 API
 * GET /api/v2/notifications/preferences
 */
export async function GET(request: NextRequest) {
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
    const userRepository = new UserSupabaseRepository(supabase)

    // 4. 유스케이스 실행
    const useCase = new GetNotificationPreferencesUseCase(userRepository)

    const result = await useCase.execute({
      userId: user.id
    })

    // 5. 응답 반환
    return NextResponse.json({
      preferences: result.preferences.map(pref => ({
        type: pref.type,
        channels: pref.channels,
        enabled: pref.enabled,
        displayName: getNotificationTypeDisplayName(pref.type),
        description: getNotificationTypeDescription(pref.type)
      }))
    }, { status: 200 })

  } catch (error) {
    console.error('Get notification preferences error:', error)

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
 * 알림 설정 업데이트 API
 * PUT /api/v2/notifications/preferences
 */
export async function PUT(request: NextRequest) {
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

    // 2. 요청 본문 파싱
    const body = await request.json()
    const validationResult = updatePreferencesSchema.safeParse(body)

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      return NextResponse.json(
        { 
          error: 'Bad Request',
          message: firstError.message 
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

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
    const userRepository = new UserSupabaseRepository(supabase)

    // 5. 유스케이스 실행
    const useCase = new UpdateNotificationPreferencesUseCase(userRepository)

    const result = await useCase.execute({
      userId: user.id,
      type: data.type,
      channels: data.channels,
      enabled: data.enabled
    })

    // 6. 응답 반환
    return NextResponse.json({
      success: true,
      message: '알림 설정이 업데이트되었습니다'
    }, { status: 200 })

  } catch (error) {
    console.error('Update notification preferences error:', error)

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

/**
 * 알림 타입 표시 이름
 */
function getNotificationTypeDisplayName(type: string): string {
  const names: Record<string, string> = {
    'reservation_created': '예약 생성',
    'reservation_approved': '예약 승인',
    'reservation_rejected': '예약 거절',
    'reservation_cancelled': '예약 취소',
    'reservation_reminder': '예약 리마인더',
    'check_in_reminder': '체크인 알림',
    'no_show_warning': '노쇼 경고',
    'system_announcement': '시스템 공지',
    'maintenance_notice': '점검 안내'
  }
  return names[type] || type
}

/**
 * 알림 타입 설명
 */
function getNotificationTypeDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'reservation_created': '예약이 생성되었을 때 알림을 받습니다',
    'reservation_approved': '예약이 승인되었을 때 알림을 받습니다',
    'reservation_rejected': '예약이 거절되었을 때 알림을 받습니다',
    'reservation_cancelled': '예약이 취소되었을 때 알림을 받습니다',
    'reservation_reminder': '예약 시간 1시간 전에 리마인더를 받습니다',
    'check_in_reminder': '체크인 시간에 알림을 받습니다',
    'no_show_warning': '체크인하지 않으면 노쇼 경고를 받습니다',
    'system_announcement': '중요한 시스템 공지사항을 받습니다',
    'maintenance_notice': '시스템 점검 안내를 받습니다'
  }
  return descriptions[type] || ''
}