import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/db'
import { createAdminClient } from '@/lib/db'
import { z } from 'zod'
import { autoCheckDeviceStatus } from '@/lib/device-status-manager'

// 쿼리 스키마 정의
const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  deviceId: z.string().uuid()
})

// GET /api/v2/time-slots/available - 예약 가능한 시간대 조회
export async function GET(request: NextRequest) {
  try {
    // 자동 기기 상태 체크 실행 (시간대 조회 시 필수)
    try {
      const statusCheck = await autoCheckDeviceStatus()
      if (statusCheck.executed) {
        console.log(`✅ Auto status check completed - Expired: ${statusCheck.expiredCount}, Started: ${statusCheck.startedCount}`)
      }
    } catch (statusError) {
      console.error('❌ Auto status check failed:', statusError)
      // 상태 체크 실패해도 시간대 조회는 계속 진행
    }

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
          name,
          rental_settings
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

    // 해당 날짜의 모든 예약 조회 (기기 타입별)
    // RLS를 우회하기 위해 service role 클라이언트 사용
    const supabaseAdmin = createAdminClient()
    const { data: reservations, error: reservationError } = await supabaseAdmin
      .from('reservations')
      .select(`
        device_id,
        user_id,
        start_time,
        end_time,
        status,
        devices (
          device_number,
          device_type_id
        )
      `)
      .eq('date', validatedQuery.date)
      .in('status', ['pending', 'approved', 'checked_in'])

    if (reservationError) {
      console.error('예약 정보 조회 오류:', reservationError)
    }
    
    console.log('예약 조회 결과:', reservations?.length || 0, '개')
    console.log('예약 상세:', reservations?.slice(0, 3).map(r => ({
      device_id: r.device_id,
      start_time: r.start_time,
      devices: r.devices
    })))
    
    // 사용자의 동일 시간대 예약 체크 제거 - 같은 시간대 여러 기기 예약 가능
    const userReservedTimeSlots: string[] = []

    // 기기 타입별 예약 현황 맵 생성
    const deviceReservationMap = new Map()
    
    // 시간대별(조기/밤샘) 예약 수 계산
    let earlySlotReservationCount = 0  // 조기 시간대 예약 수
    let overnightSlotReservationCount = 0  // 밤샘 시간대 예약 수
    
    ;(reservations || []).forEach((reservation: any) => {
      const resDevice = Array.isArray(reservation.devices) ? reservation.devices[0] : reservation.devices
      if (resDevice?.device_type_id === device.device_type_id) {
        const timeKey = `${reservation.start_time}-${reservation.end_time}`
        if (!deviceReservationMap.has(timeKey)) {
          deviceReservationMap.set(timeKey, [])
        }
        deviceReservationMap.get(timeKey).push({
          device_number: resDevice.device_number,
          reservation_status: reservation.status
        })
        
        // 시간대별 카운트 증가
        const startHour = parseInt(reservation.start_time.split(':')[0])
        if (startHour >= 7 && startHour <= 14) {
          earlySlotReservationCount++
        } else if (startHour >= 22 || startHour <= 5) {
          overnightSlotReservationCount++
        }
      }
    })
    
    // device_types의 rental_settings에서 max_rental_units 가져오기
    // 설정이 없으면 실제 기기 대수를 기본값으로 사용
    const deviceCount = await getDeviceCount(device.device_type_id, supabase)
    const maxRentalUnits = device.device_types?.rental_settings?.max_rental_units || deviceCount
    console.log(`${device.device_types?.name} max_rental_units:`, maxRentalUnits)
    console.log('조기 시간대 예약:', earlySlotReservationCount, '밤샘 시간대 예약:', overnightSlotReservationCount)

    // 시간대 데이터를 API 응답 형식으로 변환
    const slots = (timeSlots || [])
      .filter(slot => !isYouth || slot.is_youth_time) // 청소년인 경우 청소년 시간대만 필터링
      .map(slot => {
        const timeKey = `${slot.start_time}-${slot.end_time}`
        const deviceReservationStatus = deviceReservationMap.get(timeKey) || []
        const isUserAlreadyReserved = userReservedTimeSlots.includes(timeKey)
        
        // 해당 시간대와 겹치는 예약들의 기기 번호 수집
        const overlappingDevices = new Set<number>()
        const slotStart = slot.start_time
        const slotEnd = slot.end_time
        
        ;(reservations || []).forEach((reservation: any) => {
          const resDevice = Array.isArray(reservation.devices) ? reservation.devices[0] : reservation.devices
          if (resDevice?.device_type_id === device.device_type_id) {
            // 시간 겹침 확인: 예약 시작 < 슬롯 종료 AND 예약 종료 > 슬롯 시작
            if (reservation.start_time < slotEnd && reservation.end_time > slotStart) {
              overlappingDevices.add(resDevice.device_number)
            }
          }
        })
        
        // 겹치는 기기들의 예약 상태 정보 생성
        const overlappingDeviceStatus = Array.from(overlappingDevices).map(deviceNum => {
          const reservation = reservations?.find((r: any) => {
            const resDevice = Array.isArray(r.devices) ? r.devices[0] : r.devices
            return resDevice?.device_number === deviceNum && 
              resDevice?.device_type_id === device.device_type_id &&
              r.start_time < slotEnd && 
              r.end_time > slotStart
          })
          return {
            device_number: deviceNum,
            reservation_status: reservation?.status || 'unknown'
          }
        })
        
        // 밤샘 시간대를 24-29시로 변환하는 함수
        const formatTimeForDisplay = (time: string, isOvernight: boolean) => {
          const hour = parseInt(time.split(':')[0]!)
          const minute = time.split(':')[1]!
          
          // 밤샘 시간대이고 0-5시 사이인 경우 24-29시로 변환
          if (isOvernight && hour >= 0 && hour <= 5) {
            return `${hour + 24}:${minute}`
          }
          return `${hour.toString().padStart(2, '0')}:${minute}`
        }
        
        const isOvernight = slot.slot_type === 'overnight'
        const displayStartTime = formatTimeForDisplay(slot.start_time, isOvernight)
        const displayEndTime = formatTimeForDisplay(slot.end_time, isOvernight)
        
        return {
          id: slot.id,
          timeSlot: {
            id: slot.id,
            name: `${displayStartTime.slice(0,5)}-${displayEndTime.slice(0,5)}`,
            description: slot.slot_type === 'overnight' ? '밤샘대여' : slot.slot_type === 'early' ? '조기대여' : '일반대여',
            startHour: parseInt(slot.start_time.split(':')[0]),
            endHour: parseInt(slot.end_time.split(':')[0]),
            displayTime: `${displayStartTime.slice(0,5)} - ${displayEndTime.slice(0,5)}`,
            duration: 0, // 계산 필요시 추가
            type: slot.slot_type
          },
          available: true, // 모든 시간대 선택 가능 (동시 예약 제한만 확인)
          userAlreadyReserved: false, // 동일 시간대 체크 제거
          remainingSlots: Math.max(0, maxRentalUnits - overlappingDevices.size),
          creditOptions: slot.credit_options || [],
          enable2P: slot.enable_2p || false,
          price2PExtra: slot.price_2p_extra,
          isYouthTime: slot.is_youth_time,
          device_reservation_status: overlappingDeviceStatus // 겹치는 기기들의 예약 정보
        }
      })

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
 * 기기 타입별 실제 대수 조회
 */
async function getDeviceCount(deviceTypeId: string, supabase: any): Promise<number> {
  const { data, error } = await supabase
    .from('devices')
    .select('id')
    .eq('device_type_id', deviceTypeId)
    .in('status', ['available', 'in_use'])
  
  if (error) {
    console.error('기기 대수 조회 오류:', error)
    return 3 // 오류시 기본값
  }
  
  return data?.length || 3
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