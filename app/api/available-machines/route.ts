import { createServerClient as createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// 예약 가능한 기기와 시간대 조회
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    // 1. 대여 가능한 모든 기기 조회
    const supabase = createClient();
  const { data$1 } = await supabase.from('rental_machines')
      .select(`
        *,
        machines!inner(*)
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (machinesError) {
      console.error('Get rental machines error:', machinesError)
      return NextResponse.json({ error: '기기 목록을 불러올 수 없습니다' }, { status: 500 })
    }

    // 2. 선택한 날짜의 예약 현황 조회
    let reservations: Array<{rental_machine_id: string, start_time: string, end_time: string}> = []
    if (date) {
      const supabase = createClient();
  const { data$1 } = await supabase.from('reservations')
        .select('rental_machine_id, start_time, end_time')
        .eq('date', date)
        .in('status', ['pending', 'approved', 'checked_in'])

      if (!reservationError) {
        reservations = reservationData || []
      }
    }

    // 3. 각 기기에 대한 사용 가능한 시간대 계산
    const machinesWithAvailability = machines?.map(machine => {
      // 해당 기기의 예약된 시간대 찾기
      const machineReservations = reservations.filter(r => r.rental_machine_id === machine.id)
      
      // 기본 운영 시간 (10:00 - 22:00)

      // 사용 가능한 시간대 계산 (간단한 예시)
      const availableSlots = []
      
      // 2시간 단위로 시간대 생성
      for (let hour = 10; hour < 22; hour += 2) {
        const startTime = `${hour.toString().padStart(2, '0')}:00`
        const endTime = `${(hour + 2).toString().padStart(2, '0')}:00`
        
        // 해당 시간대가 예약되었는지 확인
        const isReserved = machineReservations.some(res => {
          return (res.start_time < endTime && res.end_time > startTime)
        })

        if (!isReserved) {
          availableSlots.push({
            start_time: startTime,
            end_time: endTime,
            price: machine.hourly_rate * 2 // 2시간 가격
          })
        }
      }

      return {
        ...machine,
        available_slots: availableSlots,
        type: machine.machines?.type || 'other'
      }
    }) || []

    // 4. 기기 타입별로 그룹화
    const groupedByType = machinesWithAvailability.reduce((acc, machine) => {
      const type = machine.type
      if (!acc[type]) {
        acc[type] = {
          type: type,
          name: getTypeName(type),
          machines: []
        }
      }
      acc[type].machines.push(machine)
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json({ 
      machines: machinesWithAvailability,
      groupedByType: Object.values(groupedByType),
      totalCount: machines?.length || 0
    })

  } catch (error) {
    console.error('Available machines API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 기기 타입 한글명 변환
function getTypeName(type: string): string {
  const typeNames: Record<string, string> = {
    'maimai': '마이마이',
    'chunithm': '츄니즘', 
    'tekken': '철권',
    'sf6': '스트리트 파이터 6',
    'other': '기타'
  }
  return typeNames[type] || type
}