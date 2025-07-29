import { NextRequest, NextResponse } from 'next/server'
import { TimeSlotDomainService } from '@/src/domain/services/time-slot-domain.service'
import { CreateTimeSlotTemplateUseCase, GetTimeSlotTemplatesUseCase } from '@/src/application/use-cases/time-slot'
import { SupabaseTimeSlotTemplateRepository } from '@/src/infrastructure/repositories/supabase-time-slot-template.repository'
import { SupabaseTimeSlotScheduleRepository } from '@/src/infrastructure/repositories/supabase-time-slot-schedule.repository'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// 요청 스키마 정의
const createTimeSlotSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['early', 'overnight']),
  startHour: z.number().min(0).max(29),
  endHour: z.number().min(1).max(30),
  creditOptions: z.array(z.object({
    type: z.enum(['fixed', 'freeplay', 'unlimited']),
    hours: z.array(z.number()),
    prices: z.record(z.number()),
    fixedCredits: z.number().optional()
  })).min(1),
  enable2P: z.boolean(),
  price2PExtra: z.number().optional(),
  isYouthTime: z.boolean(),
  priority: z.number().optional(),
  isActive: z.boolean().optional()
})

// GET /api/v2/time-slots - 시간대 템플릿 목록 조회
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const supabase = await createClient()
    let user = null
    let authError = null
    
    try {
      const authResult = await supabase.auth.getUser()
      user = authResult.data?.user
      authError = authResult.error
    } catch (error) {
      console.error('인증 확인 중 오류:', error)
      authError = error
    }
    
    if (authError || !user) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams
    const query = {
      type: searchParams.get('type') as 'early' | 'overnight' | undefined,
      active: searchParams.get('active') === 'true' ? true : searchParams.get('active') === 'false' ? false : undefined,
      youthOnly: searchParams.get('youthOnly') === 'true' ? true : undefined,
      sortByPriority: searchParams.get('sortByPriority') === 'true' ? true : undefined
    }

    // 레포지토리 및 유스케이스 초기화
    const templateRepository = new SupabaseTimeSlotTemplateRepository(supabase)
    const getTemplatesUseCase = new GetTimeSlotTemplatesUseCase(templateRepository)

    // 템플릿 조회
    const result = await getTemplatesUseCase.execute({
      type: query.type,
      isActive: query.active,
      isYouthTime: query.youthOnly,
      sortByPriority: query.sortByPriority
    })

    // 응답 변환
    const response = {
      data: result.templates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        type: template.type,
        startHour: template.timeSlot.startHour,
        endHour: template.timeSlot.endHour,
        displayTime: template.timeSlot.formatKST(),
        duration: template.timeSlot.duration,
        creditOptions: template.creditOptions,
        enable2P: template.enable2P,
        price2PExtra: template.price2PExtra,
        isYouthTime: template.isYouthTime,
        priority: template.priority,
        active: template.isActive,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString()
      }))
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('시간대 템플릿 조회 오류:', error)
    
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

// POST /api/v2/time-slots - 시간대 템플릿 생성 (관리자 전용)
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
    const validatedData = createTimeSlotSchema.parse(body)

    // 레포지토리 및 서비스 초기화
    const templateRepository = new SupabaseTimeSlotTemplateRepository(supabase)
    const scheduleRepository = new SupabaseTimeSlotScheduleRepository(supabase)
    const domainService = new TimeSlotDomainService(templateRepository, scheduleRepository)
    const createTemplateUseCase = new CreateTimeSlotTemplateUseCase(domainService)

    // 템플릿 생성
    const result = await createTemplateUseCase.execute(validatedData)

    // 응답 변환
    const response = {
      id: result.template.id,
      name: result.template.name,
      description: result.template.description,
      type: result.template.type,
      startHour: result.template.timeSlot.startHour,
      endHour: result.template.timeSlot.endHour,
      displayTime: result.template.timeSlot.formatKST(),
      duration: result.template.timeSlot.duration,
      creditOptions: result.template.creditOptions,
      enable2P: result.template.enable2P,
      price2PExtra: result.template.price2PExtra,
      isYouthTime: result.template.isYouthTime,
      priority: result.template.priority,
      active: result.template.isActive,
      createdAt: result.template.createdAt.toISOString(),
      updatedAt: result.template.updatedAt.toISOString()
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('시간대 템플릿 생성 오류:', error)
    
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

    if (error instanceof Error && error.message.includes('이미 존재하는')) {
      return NextResponse.json(
        { code: 'DUPLICATE_NAME', message: error.message },
        { status: 409 }
      )
    }

    if (error instanceof Error && error.message.includes('시간대가 겹치는')) {
      return NextResponse.json(
        { code: 'TIME_CONFLICT', message: error.message },
        { status: 409 }
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