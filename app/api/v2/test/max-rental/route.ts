import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/db'

export async function GET(request: NextRequest) {
  const supabase = createAdminClient()
  
  // 비트매니아 IIDX 정보 조회
  const { data: deviceType } = await supabase
    .from('device_types')
    .select('id, name, rental_settings')
    .eq('name', 'beatmania IIDX')
    .single()
    
  // 날짜 파라미터 받기 (기본값: 내일)
  const searchParams = request.nextUrl.searchParams
  const dateParam = searchParams.get('date')
  
  let dateStr = dateParam
  if (!dateStr) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    dateStr = tomorrow.toISOString().split('T')[0]!
  }
  
  const { data: reservations } = await supabase
    .from('reservations')
    .select(`
      id,
      start_time,
      end_time,
      status,
      devices!device_id (
        device_types!device_type_id (
          id,
          name
        )
      )
    `)
    .eq('date', dateStr)
    .in('status', ['pending', 'approved', 'checked_in'])
    
  // 비트매니아 조기 시간대 예약만 필터링
  const beatmaniaEarlyReservations = (reservations || []).filter((res: any) => {
    const device = Array.isArray(res.devices) ? res.devices[0] : res.devices
    const resDeviceType = Array.isArray(device?.device_types) 
      ? device?.device_types[0] 
      : device?.device_types
    if (resDeviceType?.id !== deviceType?.id) return false
    const startHour = parseInt(res.start_time.split(':')[0])
    return startHour >= 7 && startHour < 22
  })
  
  return NextResponse.json({
    deviceType: {
      id: deviceType?.id,
      name: deviceType?.name,
      maxRentalUnits: deviceType?.rental_settings?.max_rental_units
    },
    date: dateStr,
    earlyTimeSlotReservations: beatmaniaEarlyReservations.length,
    reservations: beatmaniaEarlyReservations.map(r => ({
      id: r.id,
      time: `${r.start_time}-${r.end_time}`,
      status: r.status
    }))
  })
}