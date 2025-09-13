import { NextRequest, NextResponse } from 'next/server'
import { TimeSlotDomainService } from '@/src/domain/services/time-slot-domain.service'
import { UpdateTimeSlotTemplateUseCase, DeleteTimeSlotTemplateUseCase } from '@/src/application/use-cases/time-slot'
import { SupabaseTimeSlotTemplateRepository } from '@/src/infrastructure/repositories/supabase-time-slot-template.repository'
import { SupabaseTimeSlotScheduleRepository } from '@/src/infrastructure/repositories/supabase-time-slot-schedule.repository'
import { createClient } from '@/lib/db'
import { z } from 'zod'

// 요청 스키마 정의
const updateTimeSlotSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  creditOptions: z.array(z.object({
    type: z.enum(['fixed', 'freeplay', 'unlimited']),
    hours: z.array(z.number()),
    prices: z.record(z.number()),
    fixedCredits: z.number().optional()
  })).min(1).optional(),
  enable2P: z.boolean().optional(),
  price2PExtra: z.number().optional(),
  isYouthTime: z.boolean().optional(),
  priority: z.number().optional(),
  isActive: z.boolean().optional()
})

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/v2/time-slots/[id] - 시간대 템플릿 상세 조회
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    // params를 await로 추출
    const { id } = await params
    
    // 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    // 레포지토리 초기화
    const templateRepository = new SupabaseTimeSlotTemplateRepository(supabase)
    
    // 템플릿 조회
    const template = await templateRepository.findById(id)
    
    if (!template) {
      return NextResponse.json(
        { code: 'NOT_FOUND', message: '시간대 템플릿을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 응답 변환
    const response = {
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
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('시간대 템플릿 조회 오류:', error)
    
    return NextResponse.json(
      { 
        code: 'INTERNAL_ERROR', 
        message: error instanceof Error ? error.message : '서버 오류가 발생했습니다' 
      },
      { status: 500 }
    )
  }
}

// PUT /api/v2/time-slots/[id] - 시간대 템플릿 수정 (관리자 전용)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // params를 await로 추출
    const { id } = await params
    
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
    const validatedData = updateTimeSlotSchema.parse(body)

    // 레포지토리 및 서비스 초기화
    const templateRepository = new SupabaseTimeSlotTemplateRepository(supabase)
    const scheduleRepository = new SupabaseTimeSlotScheduleRepository(supabase)
    const domainService = new TimeSlotDomainService(templateRepository, scheduleRepository)
    const updateTemplateUseCase = new UpdateTimeSlotTemplateUseCase(domainService)

    // 템플릿 수정
    const result = await updateTemplateUseCase.execute({
      templateId: id,
      ...validatedData
    })

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

    return NextResponse.json(response)

  } catch (error) {
    console.error('시간대 템플릿 수정 오류:', error)
    
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

    if (error instanceof Error && error.message.includes('찾을 수 없습니다')) {
      return NextResponse.json(
        { code: 'NOT_FOUND', message: error.message },
        { status: 404 }
      )
    }

    if (error instanceof Error && error.message.includes('이미 존재하는')) {
      return NextResponse.json(
        { code: 'DUPLICATE_NAME', message: error.message },
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

// DELETE /api/v2/time-slots/[id] - 시간대 템플릿 삭제 (관리자 전용)
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    // params를 await로 추출
    const { id } = await params
    
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

    // 레포지토리 및 서비스 초기화
    const templateRepository = new SupabaseTimeSlotTemplateRepository(supabase)
    const scheduleRepository = new SupabaseTimeSlotScheduleRepository(supabase)
    const domainService = new TimeSlotDomainService(templateRepository, scheduleRepository)
    const deleteTemplateUseCase = new DeleteTimeSlotTemplateUseCase(domainService)

    // 템플릿 삭제
    await deleteTemplateUseCase.execute({
      templateId: id
    })

    return new NextResponse(null, { status: 204 })

  } catch (error) {
    console.error('시간대 템플릿 삭제 오류:', error)
    
    if (error instanceof Error && error.message.includes('찾을 수 없습니다')) {
      return NextResponse.json(
        { code: 'NOT_FOUND', message: error.message },
        { status: 404 }
      )
    }

    if (error instanceof Error && error.message.includes('사용 중입니다')) {
      return NextResponse.json(
        { code: 'IN_USE', message: error.message },
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