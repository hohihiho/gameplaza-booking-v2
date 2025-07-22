import { createServerClient as createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// 대여 가능한 기기 목록 조회
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const deviceTypeId = searchParams.get('deviceTypeId')
    const date = searchParams.get('date')
    const startTime = searchParams.get('startTime')
    const endTime = searchParams.get('endTime')

    // 기본 쿼리 - 활성화된 기기만 조회
    let query = supabase
      .from('rental_machines')
      .select(`
        *,
        device_types!inner(
          id,
          name,
          category,
          description,
          image_url
        )
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    // 기기 타입 필터링
    if (deviceTypeId) {
      query = query.eq('device_type_id', deviceTypeId)
    }

    const { data: machines, error: machinesError } = await query

    if (machinesError) {
      console.error('Get rental machines error:', machinesError)
      return NextResponse.json({ error: '기기 목록을 불러올 수 없습니다' }, { status: 500 })
    }

    // 특정 날짜/시간의 예약 상태 확인
    if (date && startTime && endTime && machines) {
      // 해당 시간대의 예약 조회
      const supabase = createClient();
  const { data$1 } = await supabase.from('reservations')
        .select('rental_machine_id')
        .eq('date', date)
        .in('status', ['pending', 'approved', 'checked_in'])
        .or(`start_time.lt.${endTime},end_time.gt.${startTime}`)

      if (reservationsError) {
        console.error('Get reservations error:', reservationsError)
        // 에러가 있어도 기기 목록은 반환
        return NextResponse.json({ machines })
      }

      // 예약된 기기 ID 목록
      const reservedMachineIds = reservations?.map(r => r.rental_machine_id) || []

      // 각 기기에 예약 가능 여부 추가
      const machinesWithAvailability = machines.map(machine => ({
        ...machine,
        is_available: !reservedMachineIds.includes(machine.id),
        reserved_at: reservedMachineIds.includes(machine.id) ? { date, startTime, endTime } : null
      }))

      return NextResponse.json({ 
        machines: machinesWithAvailability,
        totalCount: machines.length,
        availableCount: machinesWithAvailability.filter(m => m.is_available).length
      })
    }

    return NextResponse.json({ 
      machines,
      totalCount: machines?.length || 0
    })

  } catch (error) {
    console.error('Rental machines API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}