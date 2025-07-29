import { NextRequest, NextResponse } from 'next/server'
import { TimeSlotDomainService } from '@/src/domain/services/time-slot-domain.service'
import { GetAvailableTimeSlotsUseCase } from '@/src/application/use-cases/time-slot'
import { SupabaseTimeSlotTemplateRepository } from '@/src/infrastructure/repositories/supabase-time-slot-template.repository'
import { SupabaseTimeSlotScheduleRepository } from '@/src/infrastructure/repositories/supabase-time-slot-schedule.repository'
import { SupabaseReservationRepository } from '@/src/infrastructure/repositories/supabase-reservation.repository'
import { SupabaseDeviceRepository } from '@/src/infrastructure/repositories/supabase-device.repository'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// 쿼리 스키마 정의
const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  deviceId: z.string().uuid()
})

// GET /api/v2/time-slots/available - 예약 가능한 시간대 조회
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
      date: searchParams.get('date') || '',
      deviceId: searchParams.get('deviceId') || ''
    }

    const validatedQuery = querySchema.parse(query)

    // 사용자 연령 정보 조회 (청소년 여부 확인)
    const { data: profile } = await supabase
      .from('users')
      .select('birth_date')
      .eq('id', user.id)
      .single()

    const isYouth = profile?.birth_date ? isYouthUser(profile.birth_date) : false

    // 레포지토리 및 서비스 초기화
    const templateRepository = new SupabaseTimeSlotTemplateRepository(supabase)
    const scheduleRepository = new SupabaseTimeSlotScheduleRepository(supabase)
    const reservationRepository = new SupabaseReservationRepository(supabase)
    const deviceRepository = new SupabaseDeviceRepository(supabase)
    const domainService = new TimeSlotDomainService(templateRepository, scheduleRepository)
    
    const getAvailableTimeSlotsUseCase = new GetAvailableTimeSlotsUseCase(
      domainService,
      reservationRepository,
      deviceRepository
    )

    // 예약 가능한 시간대 조회
    const result = await getAvailableTimeSlotsUseCase.execute({
      date: validatedQuery.date,
      deviceId: validatedQuery.deviceId,
      isYouth
    })

    // 응답 변환
    const response = {
      data: result.slots,
      meta: {
        date: result.date,
        device: result.deviceInfo,
        userType: isYouth ? 'youth' : 'adult'
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('예약 가능 시간대 조회 오류:', error)
    
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

    if (error instanceof Error && error.message.includes('기기를 찾을 수 없습니다')) {
      return NextResponse.json(
        { code: 'DEVICE_NOT_FOUND', message: error.message },
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

/**
 * 청소년 여부 확인
 * 만 16세 미만인 경우 청소년으로 분류
 */
function isYouthUser(birthDate: string): boolean {
  const birth = new Date(birthDate)
  const today = new Date()
  
  // 나이 계산
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age < 16
}