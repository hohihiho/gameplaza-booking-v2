const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDBStructure() {
  console.log('🔍 DB 구조 확인 시작...\n');

  try {
    // 1. device_types 테이블 구조 확인
    console.log('=== device_types 테이블 ===');
    const { data: deviceTypes, error: dtError } = await supabase
      .from('device_types')
      .select('*')
      .limit(1);
    
    if (dtError) {
      console.log('❌ device_types 테이블 에러:', dtError.message);
    } else {
      console.log('✅ device_types 샘플 데이터:');
      console.log(JSON.stringify(deviceTypes[0], null, 2));
      
      // 전체 개수 확인
      const { count: dtCount } = await supabase
        .from('device_types')
        .select('*', { count: 'exact', head: true });
      console.log(`📊 총 ${dtCount}개의 device_types\n`);
    }

    // 2. device_categories 테이블 확인
    console.log('=== device_categories 테이블 ===');
    const { data: categories, error: catError } = await supabase
      .from('device_categories')
      .select('*')
      .limit(3);
    
    if (catError) {
      console.log('❌ device_categories 테이블 에러:', catError.message);
    } else {
      console.log('✅ device_categories 데이터:');
      categories.forEach(cat => console.log(`- ${cat.name} (id: ${cat.id})`));
    }

    // 3. devices 테이블 확인
    console.log('\n=== devices 테이블 ===');
    const { data: devices, error: devError } = await supabase
      .from('devices')
      .select('*')
      .limit(1);
    
    if (devError) {
      console.log('❌ devices 테이블 에러:', devError.message);
    } else {
      console.log('✅ devices 샘플 데이터:');
      console.log(JSON.stringify(devices[0], null, 2));
    }

    // 4. rental_time_slots 테이블 구조 확인
    console.log('\n=== rental_time_slots 테이블 ===');
    const { data: slots, error: slotsError } = await supabase
      .from('rental_time_slots')
      .select('*')
      .limit(1);
    
    if (slotsError) {
      console.log('❌ rental_time_slots 테이블 에러:', slotsError.message);
    } else {
      console.log('✅ rental_time_slots 샘플 데이터:');
      console.log(JSON.stringify(slots[0], null, 2));
      
      // 전체 개수 확인
      const { count: slotCount } = await supabase
        .from('rental_time_slots')
        .select('*', { count: 'exact', head: true });
      console.log(`📊 총 ${slotCount}개의 rental_time_slots\n`);
    }

    // 5. is_rentable이 true인 device_types 확인
    console.log('=== 대여 가능한 기기 타입 ===');
    const { data: rentableTypes, error: rentError } = await supabase
      .from('device_types')
      .select('id, name, is_rentable, rental_settings')
      .eq('is_rentable', true);
    
    if (rentError) {
      console.log('❌ 에러:', rentError.message);
    } else {
      console.log(`✅ 대여 가능한 기기 타입 ${rentableTypes.length}개:`);
      rentableTypes.forEach(type => {
        console.log(`- ${type.name} (id: ${type.id})`);
        console.log(`  rental_settings: ${JSON.stringify(type.rental_settings)}`);
      });
    }

    // 6. reservations 테이블 확인
    console.log('\n=== reservations 테이블 ===');
    const { data: reservations, error: resError } = await supabase
      .from('reservations')
      .select('*')
      .limit(1);
    
    if (resError) {
      console.log('❌ reservations 테이블 에러:', resError.message);
    } else {
      console.log('✅ reservations 테이블 존재');
      const { count: resCount } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true });
      console.log(`📊 총 ${resCount}개의 reservations\n`);
    }

    // 7. users 테이블 확인
    console.log('=== users 테이블 ===');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log('❌ users 테이블 에러:', usersError.message);
    } else {
      console.log('✅ users 테이블 존재');
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      console.log(`📊 총 ${userCount}명의 users\n`);
    }

  } catch (error) {
    console.error('전체 에러:', error);
  }
}

checkDBStructure();