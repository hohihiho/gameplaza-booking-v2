const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugMaxRentalCheck() {
  const deviceTypeId = 'b6c3c06d-e181-4cb1-95d9-c14528c5a5be'; // 비트매니아 IIDX
  const date = '2025-08-05';
  
  console.log('=== 디버그: max_rental_units 검증 ===\n');
  
  // 1. device_types 조회
  const { data: deviceType, error: deviceTypeError } = await supabase
    .from('device_types')
    .select('name, rental_settings')
    .eq('id', deviceTypeId)
    .single();
    
  console.log('1. device_types 조회 결과:');
  console.log('   - 이름:', deviceType?.name);
  console.log('   - rental_settings:', deviceType?.rental_settings);
  console.log('   - max_rental_units:', deviceType?.rental_settings?.max_rental_units);
  
  // 2. 예약 조회 (devices 관계 포함)
  const { data: reservations, error: resError } = await supabase
    .from('reservations')
    .select(`
      id,
      start_time,
      devices!device_id (
        device_types!device_type_id (
          id
        )
      )
    `)
    .eq('date', date)
    .in('status', ['pending', 'approved', 'checked_in']);
    
  console.log('\n2. 예약 조회 결과:');
  console.log('   - 전체 예약 수:', reservations?.length || 0);
  
  // 3. 필터링 테스트
  const sameTypeReservations = (reservations || []).filter((res) => {
    console.log(`   - 예약 ${res.id}:`);
    console.log(`     devices:`, res.devices);
    console.log(`     device_types:`, res.devices?.device_types);
    console.log(`     device_type_id:`, res.devices?.device_types?.id);
    
    if (res.devices?.device_types?.id !== deviceTypeId) return false;
    
    const existingStartHour = parseInt(res.start_time.split(':')[0]);
    const timeSlotType = existingStartHour >= 7 && existingStartHour < 22 ? 'early' : 'night';
    
    console.log(`     시작시간: ${res.start_time} (${existingStartHour}시)`);
    console.log(`     시간대 타입: ${timeSlotType}`);
    console.log(`     비트매니아?: ${res.devices?.device_types?.id === deviceTypeId}`);
    
    return timeSlotType === 'early';
  });
  
  console.log('\n3. 필터링 결과:');
  console.log('   - 비트매니아 조기 시간대 예약:', sameTypeReservations.length);
  console.log('   - max_rental_units:', deviceType?.rental_settings?.max_rental_units || 'undefined');
  console.log('   - 제한 초과?:', sameTypeReservations.length >= (deviceType?.rental_settings?.max_rental_units || Infinity));
}

debugMaxRentalCheck().catch(console.error);