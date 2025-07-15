import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// .env.local 파일 로드
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function createTestReservations() {
  console.log('테스트 예약 생성 시작...')
  
  try {
    // 1. 대여 가능한 기기 타입과 실제 기기 조회
    const { data: deviceTypes, error: typesError } = await supabase
      .from('device_types')
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
    console.log('대여 가능한 기기 타입:', deviceTypes)
    
    // 3. 테스트 사용자 생성 또는 조회
    const testEmail = 'test-reservation@gameplaza.com'
    const testPhone = '010-9999-9999'
    
    // 먼저 기존 사용자 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single()
    
    let userId: string
    
    if (existingUser) {
      userId = existingUser.id
      console.log('기존 테스트 사용자 사용:', userId)
    } else {
      // 새 사용자 생성 - UUID 직접 생성
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          id: crypto.randomUUID(),
          email: testEmail,
          phone: testPhone,
          name: '테스트 사용자',
          nickname: '테스트',
          role: 'user'
        })
        .select()
        .single()
      
      if (userError) throw userError
      userId = newUser.id
      console.log('새 테스트 사용자 생성:', userId)
    }
    
    // 4. 예약 생성
    const testDate = '2025-07-15'
    const reservations = []
    
    if (!deviceTypes || deviceTypes.length === 0) {
      console.log('대여 가능한 기기가 없습니다.')
      return
    }
    
    // 다양한 시간대 설정
    const timeSlots = [
      // 09:00 시작 일반 요금제들
      { start: '09:00:00', end: '11:00:00', payment: 'cash', creditType: 'freeplay' },
      { start: '09:00:00', end: '13:00:00', payment: 'cash', creditType: 'unlimited' },
      { start: '11:00:00', end: '15:00:00', payment: 'cash', creditType: 'fixed' },
      { start: '13:00:00', end: '17:00:00', payment: 'cash', creditType: 'freeplay' },
      // 밤샘 요금제들
      { start: '22:00:00', end: '02:00:00', payment: 'cash', creditType: 'unlimited' },
      { start: '22:00:00', end: '05:00:00', payment: 'cash', creditType: 'freeplay' },
      { start: '23:00:00', end: '03:00:00', payment: 'cash', creditType: 'fixed' },
    ]
    
    // 각 기기 타입별로 첫 번째 사용 가능한 기기로 예약 생성
    let slotIndex = 0
    for (const deviceType of deviceTypes) {
      if (slotIndex >= timeSlots.length) break
      
      // 해당 타입의 첫 번째 기기 선택
      const device = deviceType.devices[0]
      if (!device) continue
      
      const slot = timeSlots[slotIndex]
      
      // 시간에 따른 임의의 요금 계산
      const startHour = parseInt(slot.start.split(':')[0])
      const endHour = parseInt(slot.end.split(':')[0])
      const hours = endHour >= startHour ? endHour - startHour : (24 - startHour + endHour)
      const basePrice = slot.creditType === 'unlimited' ? 50000 : 
                       slot.creditType === 'fixed' ? 30000 : 40000
      const totalAmount = basePrice
      
      reservations.push({
        user_id: userId,
        device_id: device.id,
        date: testDate,
        start_time: slot.start,
        end_time: slot.end,
        player_count: 1,
        hourly_rate: Math.floor(totalAmount / hours), // 시간당 요금 역산
        total_amount: totalAmount,
        status: 'approved', // 승인된 상태로 생성
        payment_method: slot.payment,
        payment_status: 'pending',
        credit_type: slot.creditType,
        approved_at: new Date().toISOString(),
        user_notes: `테스트 예약 - ${deviceType.name} ${device.device_number}번기`
      })
      
      slotIndex++
    }
    
    console.log(`${reservations.length}개의 예약을 생성합니다...`)
    
    // 예약 삽입
    const { data: createdReservations, error: insertError } = await supabase
      .from('reservations')
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
    
    console.log('\n생성된 예약:')
    createdReservations?.forEach((r, index) => {
      console.log(`\n예약 ${index + 1}:`)
      console.log(`- 예약번호: ${r.reservation_number}`)
      console.log(`- 날짜: ${r.date}`)
      console.log(`- 기기: ${r.devices.device_types.name} ${r.devices.device_number}번`)
      console.log(`- 시간: ${r.start_time} ~ ${r.end_time}`)
      console.log(`- 크레딧 타입: ${r.credit_type}`)
      console.log(`- 요금: ${r.total_amount?.toLocaleString()}원`)
      console.log(`- 결제방법: ${r.payment_method === 'cash' ? '현금' : '계좌이체'}`)
      console.log(`- 상태: ${r.status}`)
    })
    
    console.log('\n테스트 예약 생성 완료!')
    
  } catch (error) {
    console.error('예약 생성 중 오류:', error)
  }
}

// 스크립트 실행
createTestReservations()