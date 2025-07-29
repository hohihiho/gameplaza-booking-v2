import { NextRequest, NextResponse } from 'next/server'
import { TimeSlotDomainService } from '@/src/domain/services/time-slot-domain.service'
import { ScheduleTimeSlotsUseCase, GetTimeSlotSchedulesUseCase } from '@/src/application/use-cases/time-slot'
import { SupabaseTimeSlotTemplateRepository } from '@/src/infrastructure/repositories/supabase-time-slot-template.repository'
import { SupabaseTimeSlotScheduleRepository } from '@/src/infrastructure/repositories/supabase-time-slot-schedule.repository'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// 요청 스키마 정의
const scheduleTimeSlotsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  deviceTypeId: z.string().uuid(),
  timeSlotIds: z.array(z.string().uuid()).min(1),
  repeat: z.object({
    type: z.enum(['daily', 'weekly', 'monthly']),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional()
  }).optional()
})

const querySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  deviceTypeId: z.string().uuid().optional()
})

// GET /api/v2/time-slots/schedules - 시간대 스케줄 조회
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 쿼리 파라미터 파싱 및 검증
    const searchParams = request.nextUrl.searchParams
    const query = {
      startDate: searchParams.get('startDate') || '',
      endDate: searchParams.get('endDate') || '',
      deviceTypeId: searchParams.get('deviceTypeId') || undefined
    }

    const validatedQuery = querySchema.parse(query)

    // 레포지토리 및 유스케이스 초기화
    const scheduleRepository = new SupabaseTimeSlotScheduleRepository(supabase)
    const getSchedulesUseCase = new GetTimeSlotSchedulesUseCase(scheduleRepository)

    // 스케줄 조회
    const result = await getSchedulesUseCase.execute(validatedQuery)

    // 응답 변환
    const response = {
      data: result.schedules,
      pagination: {
        total: result.total,
        period: result.period
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('시간대 스케줄 조회 오류:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          code: 'VALIDATION_ERROR', 
          message: '잘못된 요청 형식입니다',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        code: 'INTERNAL_ERROR', 
        message: error instanceof Error ? error.message : '서버 오류가 발생했습니다' 
      },
      { status: 500 }
    )
  }
}

// POST /api/v2/time-slots/schedules - 시간대 스케줄 설정 (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    // 인증 및 권한 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { code: 'FORBIDDEN', message: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json()
    const validatedData = scheduleTimeSlotsSchema.parse(body)

    // 레포지토리 및 서비스 초기화
    const templateRepository = new SupabaseTimeSlotTemplateRepository(supabase)
    const scheduleRepository = new SupabaseTimeSlotScheduleRepository(supabase)
    const domainService = new TimeSlotDomainService(templateRepository, scheduleRepository)
    const scheduleTimeSlotsUseCase = new ScheduleTimeSlotsUseCase(domainService)

    // 스케줄 설정
    const result = await scheduleTimeSlotsUseCase.execute(validatedData)

    // 응답 변환
    const response = result.schedules.map(schedule => ({
      id: schedule.id,
      date: schedule.dateString,
      deviceTypeId: schedule.deviceTypeId,
      deviceTypeName: schedule.deviceTypeName,
      timeSlots: schedule.templates.map(template => ({
        id: template.id,
        name: template.name,
        type: template.type,
        startHour: template.timeSlot.startHour,
        endHour: template.timeSlot.endHour,
        displayTime: template.timeSlot.formatKST()
      })),
      createdAt: schedule.createdAt.toISOString(),
      updatedAt: schedule.updatedAt.toISOString()
    }))

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('시간대 스케줄 설정 오류:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          code: 'VALIDATION_ERROR', 
          message: '잘못된 요청 형식입니다',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('과거 날짜')) {
      return NextResponse.json(
        { code: 'PAST_DATE', message: error.message },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('템플릿을 찾을 수 없습니다')) {
      return NextResponse.json(
        { code: 'TEMPLATE_NOT_FOUND', message: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { 
        code: 'INTERNAL_ERROR', 
        message: error instanceof Error ? error.message : '서버 오류가 발생했습니다' 
      },
      { status: 500 }
    )
  }
}