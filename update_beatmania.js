const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateBeatmania() {
  console.log('비트매니아 IIDX max_rental_units를 1로 설정 중...');
  
  // 1. 비트매니아 IIDX 기기 타입 ID 확인
  const { data: deviceType, error: dtError } = await supabase
    .from('device_types')
    .select('id, name')
    .eq('name', 'beatmania IIDX')
    .single();
    
  if (dtError || !deviceType) {
    console.error('기기 타입을 찾을 수 없습니다:', dtError);
    return;
  }
  
  console.log('기기 타입 ID:', deviceType.id);
  
  // 2. max_rental_units 업데이트
  const { data, error } = await supabase
    .from('rental_time_slots')
    .update({ max_rental_units: 1 })
    .eq('device_type_id', deviceType.id);
    
  if (error) {
    console.error('업데이트 오류:', error);
  } else {
    console.log('✅ max_rental_units가 1로 업데이트되었습니다');
  }
  
  // 3. 확인
  const { data: checkData } = await supabase
    .from('rental_time_slots')
    .select('*')
    .eq('device_type_id', deviceType.id);
    
  console.log('업데이트된 시간대들:');
  checkData?.forEach(slot => {
    console.log(`- ${slot.slot_type} (${slot.start_time}-${slot.end_time}): max_rental_units = ${slot.max_rental_units}`);
  });
}

updateBeatmania().catch(console.error);