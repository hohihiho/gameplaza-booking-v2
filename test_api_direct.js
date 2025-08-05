const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDirectApi() {
  try {
    // 1. 테스트 사용자 찾기
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);
      
    if (!users || users.length === 0) {
      console.log('테스트 사용자가 없습니다');
      return;
    }
    
    const testUserId = users[0].id;
    console.log('테스트 사용자:', users[0].email);
    
    // 2. UseCase를 직접 실행하는 방식으로 테스트
    // 실제로는 API를 통해 호출하지만, 여기서는 UseCase의 로직을 시뮬레이션
    
    // device_types 조회
    const { data: deviceType } = await supabase
      .from('device_types')
      .select('id, name, rental_settings')
      .eq('name', 'beatmania IIDX')
      .single();
      
    console.log('\n기기 타입 정보:');
    console.log('- ID:', deviceType.id);
    console.log('- max_rental_units:', deviceType.rental_settings?.max_rental_units);
    
    // 예약 조회
    const { data: reservations } = await supabase
      .from('reservations')
      .select(`
        id,
        start_time,
        end_time,
        devices (
          device_types (
            id
          )
        )
      `)
      .eq('date', '2025-08-05')
      .in('status', ['pending', 'approved', 'checked_in']);
      
    // 조기 시간대 예약 필터링
    const earlyReservations = reservations.filter(res => {
      if (res.devices?.device_types?.id !== deviceType.id) return false;
      const startHour = parseInt(res.start_time.split(':')[0]);
      return startHour >= 7 && startHour < 22;
    });
    
    console.log('\n조기 시간대 예약 현황:');
    earlyReservations.forEach(res => {
      console.log(`- ${res.start_time} ~ ${res.end_time}`);
    });
    console.log(`총 ${earlyReservations.length}개 / 최대 ${deviceType.rental_settings?.max_rental_units}개`);
    
    if (earlyReservations.length >= deviceType.rental_settings?.max_rental_units) {
      console.log('\n❌ 예약 불가: 조기 시간대에 이미 예약이 있습니다. 최대 대여 가능 대수(1대)를 초과했습니다');
    } else {
      console.log('\n✅ 예약 가능');
    }
    
  } catch (error) {
    console.error('오류:', error);
  }
}

testDirectApi();