const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixBeatmaniaDevices() {
  // 비트매니아 IIDX device_type_id 가져오기
  const { data: deviceType } = await supabase
    .from('device_types')
    .select('id, name')
    .eq('name', 'beatmania IIDX')
    .single();
    
  // 2번, 3번 기기 비활성화
  const { data: devices } = await supabase
    .from('devices')
    .select('id, device_number')
    .eq('device_type_id', deviceType.id)
    .gt('device_number', 1);
    
  for (const device of devices || []) {
    const { error } = await supabase
      .from('devices')
      .update({ status: 'maintenance' })
      .eq('id', device.id);
      
    if (!error) {
      console.log(`기기 #${device.device_number} 비활성화 완료`);
    }
  }
  
  // 확인
  const { data: activeDevices } = await supabase
    .from('devices')
    .select('device_number, status')
    .eq('device_type_id', deviceType.id)
    .eq('status', 'available');
    
  console.log('\n활성화된 비트매니아 IIDX 기기:', activeDevices);
}

fixBeatmaniaDevices().catch(console.error);