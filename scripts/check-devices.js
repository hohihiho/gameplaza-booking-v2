// 기기 상태 확인 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkDevices() {
  console.log('=== 기기 상태 확인 ===\n');

  try {
    // 1. device_types 확인
    const { data: deviceTypes, error: typesError } = await supabase
      .from('device_types')
      .select('*')
      .order('name');

    if (typesError) {
      console.error('device_types 조회 오류:', typesError);
      return;
    }

    console.log('1. 기기 타입 목록:');
    deviceTypes.forEach(type => {
      console.log(`  - ${type.name} (ID: ${type.id})`);
    });

    // 2. devices 확인
    console.log('\n2. 개별 기기 목록:');
    for (const type of deviceTypes) {
      const { data: devices, error: devicesError } = await supabase
        .from('devices')
        .select('*')
        .eq('device_type_id', type.id)
        .order('device_number');

      if (devicesError) {
        console.error(`  ${type.name} 기기 조회 오류:`, devicesError);
        continue;
      }

      console.log(`\n  [${type.name}]`);
      if (devices.length === 0) {
        console.log('    ❌ 등록된 기기 없음');
      } else {
        devices.forEach(device => {
          console.log(`    - ${device.device_number}번기 (상태: ${device.status})`);
        });
      }
    }

    // 3. 예약 가능한 기기 확인
    console.log('\n3. 예약 가능한 기기:');
    const { data: availableDevices } = await supabase
      .from('devices')
      .select('*, device_types!inner(name)')
      .in('status', ['available', 'in_use']);

    if (availableDevices.length === 0) {
      console.log('  ❌ 예약 가능한 기기가 없습니다!');
      console.log('  → 관리자 페이지에서 기기를 추가해주세요.');
    } else {
      availableDevices.forEach(device => {
        console.log(`  ✅ ${device.device_types.name} ${device.device_number}번기`);
      });
    }

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

checkDevices();