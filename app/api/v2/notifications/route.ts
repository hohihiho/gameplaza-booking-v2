import { NextRequest, NextResponse } from 'next/server'
import { GetUserNotificationsUseCase } from '@/src/application/use-cases/notification/manage-notifications.use-case'
import { SendNotificationUseCase } from '@/src/application/use-cases/notification/send-notification.use-case'
import { SupabaseNotificationRepository } from '@/src/infrastructure/repositories/supabase-notification.repository'
import { UserSupabaseRepository } from '@/src/infrastructure/repositories/user.supabase.repository'
import { SupabaseNotificationService } from '@/src/infrastructure/services/supabase-notification.service'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/src/infrastructure/middleware/auth.middleware'
import { z } from 'zod'

// GET 쿼리 파라미터 스키마
const getNotificationsSchema = z.object({
  type: z.string().optional(), // comma-separated values
  read: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
})

// POST 요청 바디 스키마
const sendNotificationSchema = z.object({
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
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  data: z.record(z.any()).optional(),
  channels: z.array(z.enum(['push', 'email', 'sms', 'in_app'])).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  scheduledFor: z.string().datetime().optional()
})

/**
 * 알림 목록 조회 API
 * GET /api/v2/notifications
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

    // 2. 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams
    const params = {
      type: searchParams.get('type') || undefined,
      read: searchParams.get('read') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 20
    }

    const validationResult = getNotificationsSchema.safeParse(params)

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
    const useCase = new GetUserNotificationsUseCase(
      notificationRepository,
      userRepository
    )

    // type 파라미터를 배열로 변환 (comma-separated)
    const typeArray = data.type ? data.type.split(',').map(t => t.trim()) : undefined

    const result = await useCase.execute({
      userId: user.id,
      type: typeArray as any,
      read: data.read === 'true' ? true : data.read === 'false' ? false : undefined,
      page: data.page,
      pageSize: data.pageSize
    })

    // 6. 응답 형식화
    const formattedNotifications = result.notifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      priority: notification.priority,
      read: notification.isRead(),
      sent: notification.isSent(),
      scheduledFor: notification.scheduledFor?.toISOString(),
      sentAt: notification.sentAt?.toISOString(),
      readAt: notification.readAt?.toISOString(),
      createdAt: notification.createdAt.toISOString()
    }))

    return NextResponse.json({
      notifications: formattedNotifications,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        hasNext: result.page < result.totalPages,
        hasPrev: result.page > 1
      },
      unreadCount: result.unreadCount
    }, { status: 200 })

  } catch (error) {
    console.error('Get notifications error:', error)

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
 * 알림 발송 API (관리자용)
 * POST /api/v2/notifications
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
    const validationResult = sendNotificationSchema.safeParse(body)

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
    const notificationService = new SupabaseNotificationService(supabase)

    // 5. 관리자 권한 확인 (시스템 공지와 점검 안내는 관리자만 가능)
    if (data.type === 'system_announcement' || data.type === 'maintenance_notice') {
      const requestingUser = await userRepository.findById(user.id)
      if (!requestingUser || requestingUser.role !== 'admin') {
        return NextResponse.json(
          { 
            error: 'Forbidden',
            message: '관리자만 시스템 알림을 발송할 수 있습니다' 
          },
          { status: 403 }
        )
      }
    }

    // 6. 유스케이스 실행
    const useCase = new SendNotificationUseCase(
      notificationRepository,
      userRepository,
      notificationService
    )

    const result = await useCase.execute({
      userId: user.id,
      type: data.type,
      title: data.title,
      body: data.body,
      data: data.data,
      channels: data.channels,
      priority: data.priority,
      scheduledFor: data.scheduledFor
    })

    // 7. 응답 반환
    return NextResponse.json({
      notification: {
        id: result.notification.id,
        type: result.notification.type,
        title: result.notification.title,
        body: result.notification.body,
        data: result.notification.data,
        priority: result.notification.priority,
        channels: result.notification.channels,
        scheduled: result.notification.isScheduled(),
        scheduledFor: result.notification.scheduledFor?.toISOString(),
        sent: result.sendResult?.success ?? false,
        sentChannels: result.sendResult?.sentChannels,
        failedChannels: result.sendResult?.failedChannels,
        createdAt: result.notification.createdAt.toISOString()
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Send notification error:', error)

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

      if (error.message.includes('비활성화') || error.message.includes('활성화된')) {
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