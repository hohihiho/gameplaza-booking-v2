import { NextRequest, NextResponse } from 'next/server'
import { MarkNotificationsAsReadUseCase } from '@/src/application/use-cases/notification/manage-notifications.use-case'
import { SupabaseNotificationRepository } from '@/src/infrastructure/repositories/supabase-notification.repository'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/src/infrastructure/middleware/auth.middleware'
import { z } from 'zod'

// 요청 바디 스키마
const markAsReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).optional()
})

/**
 * 알림 읽음 처리 API
 * POST /api/v2/notifications/read
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

    // 2. 요청 본문 파싱
    const body = await request.json()
    const validationResult = markAsReadSchema.safeParse(body)

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
    const notificationRepository = new SupabaseNotificationRepository(supabase)
    const userRepository = new UserSupabaseRepository(supabase)

    // 5. 유스케이스 실행
    const useCase = new MarkNotificationsAsReadUseCase(
      notificationRepository,
      userRepository
    )

    const result = await useCase.execute({
      userId: user.id,
      notificationIds: data.notificationIds
    })

    // 6. 응답 반환
    return NextResponse.json({
      success: true,
      markedCount: result.markedCount,
      message: data.notificationIds 
        ? `${result.markedCount}개의 알림을 읽음 처리했습니다`
        : '모든 알림을 읽음 처리했습니다'
    }, { status: 200 })

  } catch (error) {
    console.error('Mark notifications as read error:', error)

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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}