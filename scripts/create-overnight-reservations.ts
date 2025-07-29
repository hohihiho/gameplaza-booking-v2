import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// .env.local 파일 로드
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function createOvernightReservations() {
  console.log('밤샘 예약 생성 시작...')
  
  try {
    // 1. 기존 테스트 사용자 조회
    const testEmail = 'test-reservation@gameplaza.com'
    const supabase = createClient();
  const { data$1 } = await supabase.from('users')
      .select('id')
      .eq('email', testEmail)
      .single()
    
    if (!userData) {
      console.error('테스트 사용자를 찾을 수 없습니다.')
      return
    }
    
    const userId = userData.id
    
    // 2. 대여 가능한 기기 타입과 실제 기기 조회
    const supabase = createClient();
  const { data$1 } = await supabase.from('device_types')
      .select(`
        id,
        name,
        is_rentable,
        devices!inner (
          id,
          device_number,
          status
        )
      `)
      .eq('is_rentable', true)
      .eq('devices.status', 'available')
      .order('name')
    
    if (typesError) throw typesError
    
    const testDate = '2025-07-15'
    const overnightSlots = [
      { start: '22:00:00', end: '02:00:00', payment: 'cash', creditType: 'unlimited' },
      { start: '22:00:00', end: '05:00:00', payment: 'cash', creditType: 'freeplay' },
      { start: '23:00:00', end: '03:00:00', payment: 'cash', creditType: 'fixed' },
    ]
    
    const reservations = []
    
    // 각 슬롯별로 다른 기기 타입 선택
    for (let i = 0; i < overnightSlots.length && i < deviceTypes.length; i++) {
      const deviceType = deviceTypes[deviceTypes.length - 1 - i] // 역순으로 선택
      const device = deviceType.devices[deviceType.devices.length - 1] // 마지막 번호 기기 선택
      const slot = overnightSlots[i]
      
      // slot null 체크
      if (!slot) {
        console.warn(`Slot at index ${i} is undefined, skipping...`);
        continue;
      }
      
      // 시간에 따른 임의의 요금 계산
      const startHour = parseInt(slot.start.split(':')[0])
      const endHour = parseInt(slot.end.split(':')[0])
      const hours = endHour >= startHour ? endHour - startHour : (24 - startHour + endHour)
      const basePrice = slot.creditType === 'unlimited' ? 60000 : 
                       slot.creditType === 'fixed' ? 40000 : 50000
      const totalAmount = basePrice
      
      reservations.push({
        user_id: userId,
        device_id: device.id,
        date: testDate,
        start_time: slot.start,
        end_time: slot.end,
        player_count: 1,
        hourly_rate: Math.floor(totalAmount / hours),
        total_amount: totalAmount,
        status: 'approved',
        payment_method: slot.payment,
        payment_status: 'pending',
        credit_type: slot.creditType,
        approved_at: new Date().toISOString(),
        user_notes: `밤샘 테스트 예약 - ${deviceType.name} ${device.device_number}번기`
      })
    }
    
    console.log(`${reservations.length}개의 밤샘 예약을 생성합니다...`)
    
    // 예약 삽입
    const supabase = createClient();
  const { data$1 } = await supabase.from('reservations')
      .insert(reservations)
      .select(`
        *,
        devices (
          device_number,
          device_types (
            name
          )
        )
      `)
    
    if (insertError) throw insertError
    
    console.log('\n생성된 밤샘 예약:')
    createdReservations?.forEach((r, index) => {
      console.log(`\n밤샘 예약 ${index + 1}:`)
      console.log(`- 예약번호: ${r.reservation_number}`)
      console.log(`- 날짜: ${r.date}`)
      console.log(`- 기기: ${r.devices.device_types.name} ${r.devices.device_number}번`)
      console.log(`- 시간: ${r.start_time} ~ ${r.end_time}`)
      console.log(`- 크레딧 타입: ${r.credit_type}`)
      console.log(`- 요금: ${r.total_amount?.toLocaleString()}원`)
      console.log(`- 결제방법: ${r.payment_method === 'cash' ? '현금' : '계좌이체'}`)
      console.log(`- 상태: ${r.status}`)
    })
    
    console.log('\n밤샘 예약 생성 완료!')
    
  } catch (error) {
    console.error('예약 생성 중 오류:', error)
  }
}

// 스크립트 실행
createOvernightReservations()