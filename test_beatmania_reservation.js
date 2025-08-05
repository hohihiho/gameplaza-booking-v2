const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testBeatmaniaReservation() {
  // 비트매니아 IIDX device_type_id 가져오기
  const { data: deviceType } = await supabase
    .from('device_types')
    .select('id, name')
    .eq('name', 'beatmania IIDX')
    .single();
    
  console.log('기기 타입:', deviceType);
  
  // 해당 타입의 기기들만 가져오기
  const { data: devices } = await supabase
    .from('devices')
    .select('id, device_number, status')
    .eq('device_type_id', deviceType.id)
    .eq('status', 'available');
    
  console.log('\n사용 가능한 비트매니아 IIDX 기기:', devices);
  
  if (!devices || devices.length === 0) {
    console.log('사용 가능한 기기가 없습니다');
    return;
  }
  
  // 첫 번째 기기로 예약 시도
  const firstDevice = devices[0];
  console.log('\n첫 번째 예약 시도 - 기기 ID:', firstDevice.id);
  
  try {
    const res1 = await fetch('http://localhost:3000/api/v2/reservations/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: firstDevice.id,
        date: '2025-08-05',
        startHour: 10,
        endHour: 18,
        userNotes: '첫 번째 예약 - 조기 시간대'
      })
    });
    
    const data1 = await res1.json();
    console.log('첫 번째 예약 결과:', data1.error || '성공');
    
    // 두 번째 기기로 같은 조기 시간대 예약 시도 (실패해야 함)
    if (devices.length > 1) {
      const secondDevice = devices[1];
      console.log('\n두 번째 예약 시도 - 기기 ID:', secondDevice.id);
      
      const res2 = await fetch('http://localhost:3000/api/v2/reservations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: secondDevice.id,
          date: '2025-08-05',
          startHour: 13,
          endHour: 18,
          userNotes: '두 번째 예약 - 같은 조기 시간대 (실패해야 함)'
        })
      });
      
      const data2 = await res2.json();
      console.log('두 번째 예약 결과:', data2.error || data2.message || '성공');
    }
  } catch (error) {
    console.error('예약 테스트 오류:', error);
  }
}

testBeatmaniaReservation().catch(console.error);