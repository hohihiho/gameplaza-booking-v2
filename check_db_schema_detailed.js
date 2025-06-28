const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDetailedDBSchema() {
  console.log('🔍 상세 DB 스키마 확인 시작...\n');

  try {
    // device_types 테이블의 실제 컬럼 확인
    console.log('=== device_types 테이블 컬럼 구조 ===');
    const { data: columnsData, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'device_types' });
    
    if (columnsError) {
      // RPC가 없으면 다른 방법으로 확인
      const { data: sampleData } = await supabase
        .from('device_types')
        .select('*')
        .limit(1);
      
      if (sampleData && sampleData.length > 0) {
        console.log('device_types 컬럼:');
        Object.keys(sampleData[0]).forEach(key => {
          console.log(`  - ${key}: ${typeof sampleData[0][key]}`);
        });
      }
    } else {
      console.log(columnsData);
    }

    // rental_settings이 별도 테이블인지 확인
    console.log('\n=== rental_settings 테이블 확인 ===');
    const { data: rentalSettings, error: rsError } = await supabase
      .from('rental_settings')
      .select('*')
      .limit(1);
    
    if (rsError) {
      console.log('❌ rental_settings 테이블이 없거나 접근 불가:', rsError.message);
    } else {
      console.log('✅ rental_settings 테이블 존재');
      if (rentalSettings && rentalSettings.length > 0) {
        console.log('rental_settings 샘플 데이터:', JSON.stringify(rentalSettings[0], null, 2));
      }
    }

    // rental_time_slots 테이블의 실제 구조 확인
    console.log('\n=== rental_time_slots 테이블 상세 구조 ===');
    const { data: slotSample } = await supabase
      .from('rental_time_slots')
      .select('*')
      .limit(1);
    
    if (slotSample && slotSample.length > 0) {
      console.log('rental_time_slots 컬럼:');
      Object.keys(slotSample[0]).forEach(key => {
        const value = slotSample[0][key];
        console.log(`  - ${key}: ${typeof value} (샘플: ${JSON.stringify(value).substring(0, 50)}...)`);
      });
    }

    // device_types와 rental_settings의 관계 확인
    console.log('\n=== device_types의 rental_settings 데이터 확인 ===');
    const { data: deviceWithSettings } = await supabase
      .from('device_types')
      .select('id, name, rental_settings')
      .eq('is_rentable', true);
    
    console.log('대여 가능한 기기의 rental_settings:');
    deviceWithSettings?.forEach(device => {
      console.log(`\n${device.name} (${device.id}):`);
      console.log('  rental_settings:', JSON.stringify(device.rental_settings, null, 2));
    });

    // migration 충돌 해결을 위한 테이블 존재 여부 확인
    console.log('\n=== 테이블 존재 여부 확인 ===');
    const tables = [
      'device_categories',
      'device_types', 
      'devices',
      'rental_settings',
      'rental_time_slots',
      'play_modes'
    ];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      console.log(`${table}: ${error ? '❌ 없음' : '✅ 존재'}`);
    }

  } catch (error) {
    console.error('전체 에러:', error);
  }
}

checkDetailedDBSchema();