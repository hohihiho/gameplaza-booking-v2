import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { autoCheckDeviceStatus } from '@/lib/device-status-manager'

// 쿼리 스키마 정의
const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_hour: z.coerce.number().min(0).max(29),
  end_hour: z.coerce.number().min(1).max(30)
})

// GET /api/v2/devices/available-for-reservation - 예약 가능한 기기 조회
export async function GET(request: NextRequest) {
  try {
    // 🔄 자동 기기 상태 체크 실행
    await autoCheckDeviceStatus()
    
//     import { getDB, supabase } from '@/lib/db';
    
    // 쿼리 파라미터 파싱 및 검증
    const searchParams = request.nextUrl.searchParams
    const query = {
      date: searchParams.get('date') || '',
      start_hour: searchParams.get('start_hour') || '0',
      end_hour: searchParams.get('end_hour') || '1'
    }

    const validatedQuery = querySchema.parse(query)

    // 시간 문자열 생성
    const startTimeStr = `${validatedQuery.start_hour.toString().padStart(2, '0')}:00:00`
    const endTimeStr = `${validatedQuery.end_hour.toString().padStart(2, '0')}:00:00`

    console.log('Available devices query:', {
      date: validatedQuery.date,
      start_time: startTimeStr,
      end_time: endTimeStr
    })

    // 해당 날짜와 시간대에 예약된 기기 ID 조회
    const { data: reservedDevices, error: reservationError } = await supabase
      .from('reservations')
      .select('device_id')
      .eq('date', validatedQuery.date)
      .eq('start_time', startTimeStr)
      .eq('end_time', endTimeStr)
      .in('status', ['pending', 'approved', 'checked_in']) // 대기중, 승인됨, 체크인됨 상태

    if (reservationError) {
      console.error('예약된 기기 조회 오류:', reservationError)
      return NextResponse.json(
        { code: 'INTERNAL_ERROR', message: `예약 조회 실패: ${reservationError.message}` },
        { status: 500 }
      )
    }

    const reservedDeviceIds = new Set((reservedDevices || []).map(r => r.device_id))
    
    console.log('Reserved device IDs:', Array.from(reservedDeviceIds))

    // 모든 렌탈 가능한 기기 타입 조회
    const { data: deviceTypesData, error: typesError } = await supabase
      .from('device_types')
      .select(`
        *,
        device_categories!category_id (
          id,
          name,
          display_order
        ),
        devices (
          id,
          device_number,
          status,
          is_active
        )
      `)
      .eq('is_rentable', true)
      .order('display_order', { ascending: true })

    if (typesError) {
      console.error('Supabase query error:', typesError)
      return NextResponse.json(
        { code: 'INTERNAL_ERROR', message: `기기 타입 조회 실패: ${typesError.message}` },
        { status: 500 }
      )
    }

    // 예약 가능한 기기만 필터링
    const processedTypes = (deviceTypesData || []).map(type => {
      const rentalSettings = type.rental_settings || {}
      
      // 물리적으로 사용 가능하고, 예약되지 않은 기기만 필터링
      const availableDevices = (type.devices || []).filter((device: any) => 
        device.status === 'available' && 
        device.is_active && 
        !reservedDeviceIds.has(device.id)
      )

      // 예약 대기중인 기기 (UI에서 비활성화 표시용)
      const pendingDevices = (type.devices || []).filter((device: any) => 
        device.status === 'available' && 
        device.is_active && 
        reservedDeviceIds.has(device.id)
      )

      return {
        ...type,
        category: type.device_categories?.name || '',
        devices: type.devices || [],
        available_devices: availableDevices,
        pending_devices: pendingDevices,
        active_device_count: availableDevices.length,
        pending_device_count: pendingDevices.length,
        total_device_count: type.devices?.length || 0,
        rental_display_order: rentalSettings.display_order,
        max_rental_units: rentalSettings.max_rental_units,
        max_players: rentalSettings.max_players,
        price_multiplier_2p: rentalSettings.price_multiplier_2p
      }
    })

    // rental_settings의 display_order로 정렬
    const sortedTypes = processedTypes.sort((a, b) => {
      const orderA = a.rental_display_order ?? a.display_order ?? 999
      const orderB = b.rental_display_order ?? b.display_order ?? 999
      return orderA - orderB
    })

    console.log('Available devices processed:', sortedTypes.length, 'types')

    return NextResponse.json({
      data: sortedTypes,
      meta: {
        date: validatedQuery.date,
        time_range: `${startTimeStr}-${endTimeStr}`,
        reserved_device_count: reservedDeviceIds.size
      }
    })

  } catch (error) {
    console.error('예약 가능 기기 조회 오류:', error)
    
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