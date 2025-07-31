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
    // Supabase 클라이언트 생성 (시간대 조회는 공개 정보이므로 인증 불필요)
    const supabase = await createClient()
    
    // 사용자 정보 조회 (청소년 여부 확인용, 로그인하지 않은 경우 성인으로 간주)
    const { data: { user } } = await supabase.auth.getUser()
    let isYouth = false
    
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('birth_date')
        .eq('id', user.id)
        .single()
      
      isYouth = profile?.birth_date ? isYouthUser(profile.birth_date) : false
    }

    // 쿼리 파라미터 파싱 및 검증
    const searchParams = request.nextUrl.searchParams
    const query = {
      date: searchParams.get('date') || '',
      deviceId: searchParams.get('deviceId') || ''
    }

    const validatedQuery = querySchema.parse(query)

    // 기기 정보 조회
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select(`
        *,
        device_types (
          id,
          name
        )
      `)
      .eq('id', validatedQuery.deviceId)
      .single()

    if (deviceError || !device) {
      console.error('Device not found:', { deviceId: validatedQuery.deviceId, error: deviceError })
      return NextResponse.json(
        { 
          code: 'DEVICE_NOT_FOUND', 
          message: '기기를 찾을 수 없습니다',
          data: [],
          meta: {
            date: validatedQuery.date,
            device: null,
            userType: isYouth ? 'youth' : 'adult'
          }
        },
        { status: 200 } // 404 대신 200으로 변경하여 프론트엔드에서 처리하도록
      )
    }

    // 해당 기기 타입의 시간대 조회
    const { data: timeSlots, error: timeSlotsError } = await supabase
      .from('rental_time_slots')
      .select('*')
      .eq('device_type_id', device.device_type_id)
      .order('start_time', { ascending: true })

    if (timeSlotsError) {
      return NextResponse.json(
        { code: 'INTERNAL_ERROR', message: `시간대 조회 실패: ${timeSlotsError.message}` },
        { status: 500 }
      )
    }

    // 시간대 데이터를 API 응답 형식으로 변환
    const slots = (timeSlots || [])
      .filter(slot => !isYouth || slot.is_youth_time) // 청소년인 경우 청소년 시간대만 필터링
      .map(slot => ({
        timeSlot: {
          id: slot.id,
          name: `${slot.start_time.slice(0,5)}-${slot.end_time.slice(0,5)}`,
          description: slot.slot_type === 'overnight' ? '밤샘대여' : slot.slot_type === 'early' ? '조기대여' : '일반대여',
          startHour: parseInt(slot.start_time.split(':')[0]),
          endHour: parseInt(slot.end_time.split(':')[0]),
          displayTime: `${slot.start_time.slice(0,5)} - ${slot.end_time.slice(0,5)}`,
          duration: 0, // 계산 필요시 추가
          type: slot.slot_type
        },
        available: true, // 임시로 모두 예약 가능으로 설정
        remainingSlots: 4, // 임시 값
        creditOptions: slot.credit_options || [],
        enable2P: slot.enable_2p || false,
        price2PExtra: slot.price_2p_extra,
        isYouthTime: slot.is_youth_time
      }))

    const result = {
      slots,
      date: validatedQuery.date,
      deviceInfo: {
        id: device.id,
        typeId: device.device_type_id,
        typeName: device.device_types?.name || '',
        deviceNumber: device.device_number
      }
    }

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