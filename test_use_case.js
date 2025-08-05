const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMaxRentalValidation() {
  try {
    console.log('=== 최대 예약 대수 검증 테스트 ===\n');
    
    // 1. 현재 비트매니아 예약 상태 확인
    const { data: currentReservations } = await supabase
      .from('reservations')
      .select(`
        id,
        start_time,
        end_time,
        devices!device_id (
          device_number,
          device_types!device_type_id (
            name
          )
        )
      `)
      .eq('date', '2025-08-05')
      .in('status', ['pending', 'approved', 'checked_in']);
      
    console.log('현재 2025-08-05 예약 상태:');
    currentReservations?.forEach(res => {
      console.log(`- ${res.devices.device_types.name} #${res.devices.device_number}: ${res.start_time} - ${res.end_time}`);
    });
    
    // 2. UseCase의 검증 로직 시뮬레이션
    const deviceTypeId = 'b6c3c06d-e181-4cb1-95d9-c14528c5a5be'; // beatmania IIDX
    const newStartHour = 9; // 조기 시간대
    
    // device_types 조회
    const { data: deviceType } = await supabase
      .from('device_types')
      .select('rental_settings')
      .eq('id', deviceTypeId)
      .single();
      
    const maxRentalUnits = deviceType?.rental_settings?.max_rental_units;
    console.log(`\n비트매니아 IIDX max_rental_units: ${maxRentalUnits}`);
    
    // 같은 시간대 예약 필터링
    const beatmaniaEarlyReservations = (currentReservations || []).filter(res => {
      if (res.devices?.device_types?.name !== 'beatmania IIDX') return false;
      const startHour = parseInt(res.start_time.split(':')[0]);
      const timeSlotType = startHour >= 7 && startHour < 22 ? 'early' : 'night';
      return timeSlotType === 'early';
    });
    
    console.log(`\n조기 시간대 비트매니아 예약 수: ${beatmaniaEarlyReservations.length}`);
    console.log(`제한 초과 여부: ${beatmaniaEarlyReservations.length >= maxRentalUnits}`);
    
    if (beatmaniaEarlyReservations.length >= maxRentalUnits) {
      console.log('\n❌ 예약 생성 차단해야 함!');
      console.log('오류 메시지: 해당 시간대에 이미 최대 예약 가능 대수에 도달했습니다');
    } else {
      console.log('\n✅ 예약 생성 가능');
    }
    
  } catch (error) {
    console.error('오류:', error);
  }
}

testMaxRentalValidation();