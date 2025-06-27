const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  try {
    console.log('기기 관리 시스템 설정 중...');
    
    // 1. 카테고리 생성
    console.log('1. 카테고리 생성 중...');
    const categories = [
      { name: 'SEGA', display_order: 1 },
      { name: 'KONAMI', display_order: 2 },
      { name: 'BANDAI NAMCO', display_order: 3 },
      { name: '기타', display_order: 4 }
    ];
    
    const { data: categoryData, error: categoryError } = await supabase
      .from('device_categories')
      .upsert(categories, { onConflict: 'name' })
      .select();
    
    if (categoryError) {
      console.error('카테고리 생성 실패:', categoryError);
      return;
    }
    console.log('✅ 카테고리 생성 완료');
    
    // 2. 기기 타입 생성
    console.log('2. 기기 타입 생성 중...');
    const categoryMap = {};
    categoryData.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });
    
    const deviceTypes = [
      // SEGA
      { category_id: categoryMap['SEGA'], name: '마이마이 DX', description: '터치스크린 리듬게임', is_rentable: true },
      { category_id: categoryMap['SEGA'], name: '춘리즘', description: '체감형 리듬게임', is_rentable: true },
      { category_id: categoryMap['SEGA'], name: 'WACCA', description: '원형 터치 리듬게임', is_rentable: false },
      
      // KONAMI
      { category_id: categoryMap['KONAMI'], name: '사운드 볼텍스', description: '노브 컨트롤러 리듬게임', is_rentable: true },
      { category_id: categoryMap['KONAMI'], name: 'beatmania IIDX', description: '7키+턴테이블 리듬게임', is_rentable: true },
      { category_id: categoryMap['KONAMI'], name: '유비트', description: '16버튼 리듬게임', is_rentable: false },
      { category_id: categoryMap['KONAMI'], name: 'DDR', description: '댄스 리듬게임', is_rentable: true },
      
      // BANDAI NAMCO
      { category_id: categoryMap['BANDAI NAMCO'], name: '태고의 달인', description: '북 리듬게임', is_rentable: true },
      { category_id: categoryMap['BANDAI NAMCO'], name: '철권 7', description: '대전격투게임', is_rentable: false },
      
      // 기타
      { category_id: categoryMap['기타'], name: 'GROOVE COASTER', description: '터치바 리듬게임', is_rentable: false }
    ];
    
    const { data: typeData, error: typeError } = await supabase
      .from('device_types')
      .upsert(deviceTypes, { onConflict: 'name' })
      .select();
    
    if (typeError) {
      console.error('기기 타입 생성 실패:', typeError);
      return;
    }
    console.log('✅ 기기 타입 생성 완료');
    
    // 3. 플레이 모드 생성
    console.log('3. 플레이 모드 생성 중...');
    const typeMap = {};
    typeData.forEach(type => {
      typeMap[type.name] = type.id;
    });
    
    const playModes = [
      // 마이마이 DX
      { device_type_id: typeMap['마이마이 DX'], name: '스탠다드', price: 1000, display_order: 1 },
      { device_type_id: typeMap['마이마이 DX'], name: 'DX', price: 1500, display_order: 2 },
      
      // 사운드 볼텍스
      { device_type_id: typeMap['사운드 볼텍스'], name: '라이트', price: 1000, display_order: 1 },
      { device_type_id: typeMap['사운드 볼텍스'], name: '스탠다드', price: 1500, display_order: 2 },
      { device_type_id: typeMap['사운드 볼텍스'], name: '프리미엄', price: 2000, display_order: 3 },
      
      // beatmania IIDX
      { device_type_id: typeMap['beatmania IIDX'], name: '스탠다드', price: 1500, display_order: 1 },
      { device_type_id: typeMap['beatmania IIDX'], name: '프리미엄', price: 2000, display_order: 2 },
      
      // 춘리즘
      { device_type_id: typeMap['춘리즘'], name: '스탠다드', price: 1000, display_order: 1 },
      { device_type_id: typeMap['춘리즘'], name: '파라다이스', price: 1500, display_order: 2 },
      
      // DDR
      { device_type_id: typeMap['DDR'], name: '싱글', price: 1000, display_order: 1 },
      { device_type_id: typeMap['DDR'], name: '더블', price: 1500, display_order: 2 },
      
      // 태고의 달인
      { device_type_id: typeMap['태고의 달인'], name: '스탠다드', price: 1000, display_order: 1 }
    ];
    
    const { error: modeError } = await supabase
      .from('play_modes')
      .insert(playModes);
    
    if (modeError) {
      console.error('플레이 모드 생성 실패:', modeError);
      return;
    }
    console.log('✅ 플레이 모드 생성 완료');
    
    // 4. 대여 설정 생성
    console.log('4. 대여 설정 생성 중...');
    const rentalSettings = [
      // 마이마이 DX
      { device_type_id: typeMap['마이마이 DX'], base_price: 50000, credit_types: ['freeplay', 'unlimited'], max_players: 2, price_multiplier_2p: 1.5 },
      
      // 사운드 볼텍스
      { device_type_id: typeMap['사운드 볼텍스'], base_price: 40000, credit_types: ['fixed', 'freeplay'], fixed_credits: 10, max_players: 1 },
      
      // beatmania IIDX
      { device_type_id: typeMap['beatmania IIDX'], base_price: 40000, credit_types: ['fixed', 'freeplay'], fixed_credits: 8, max_players: 1 },
      
      // 춘리즘
      { device_type_id: typeMap['춘리즘'], base_price: 45000, credit_types: ['freeplay', 'unlimited'], max_players: 1 },
      
      // DDR
      { device_type_id: typeMap['DDR'], base_price: 35000, credit_types: ['freeplay', 'unlimited'], max_players: 2, price_multiplier_2p: 1.5 },
      
      // 태고의 달인
      { device_type_id: typeMap['태고의 달인'], base_price: 30000, credit_types: ['fixed', 'freeplay', 'unlimited'], fixed_credits: 15, max_players: 2, price_multiplier_2p: 1.3 }
    ];
    
    const { error: rentalError } = await supabase
      .from('rental_settings')
      .upsert(rentalSettings, { onConflict: 'device_type_id' });
    
    if (rentalError) {
      console.error('대여 설정 생성 실패:', rentalError);
      return;
    }
    console.log('✅ 대여 설정 생성 완료');
    
    // 5. 개별 기기 생성
    console.log('5. 개별 기기 생성 중...');
    const devices = [
      // 마이마이 DX (2대)
      { device_type_id: typeMap['마이마이 DX'], device_number: 1, status: 'available' },
      { device_type_id: typeMap['마이마이 DX'], device_number: 2, status: 'available' },
      
      // 사운드 볼텍스 (3대)
      { device_type_id: typeMap['사운드 볼텍스'], device_number: 1, status: 'maintenance', notes: '버튼 수리 중' },
      { device_type_id: typeMap['사운드 볼텍스'], device_number: 2, status: 'available' },
      { device_type_id: typeMap['사운드 볼텍스'], device_number: 3, status: 'available' },
      
      // beatmania IIDX (2대)
      { device_type_id: typeMap['beatmania IIDX'], device_number: 1, status: 'available' },
      { device_type_id: typeMap['beatmania IIDX'], device_number: 2, status: 'available' },
      
      // 춘리즘 (1대)
      { device_type_id: typeMap['춘리즘'], device_number: 1, status: 'available' },
      
      // DDR (2대)
      { device_type_id: typeMap['DDR'], device_number: 1, status: 'available' },
      { device_type_id: typeMap['DDR'], device_number: 2, status: 'in_use' },
      
      // 태고의 달인 (2대)
      { device_type_id: typeMap['태고의 달인'], device_number: 1, status: 'available' },
      { device_type_id: typeMap['태고의 달인'], device_number: 2, status: 'available' },
      
      // 철권 7 (4대)
      { device_type_id: typeMap['철권 7'], device_number: 1, status: 'available' },
      { device_type_id: typeMap['철권 7'], device_number: 2, status: 'available' },
      { device_type_id: typeMap['철권 7'], device_number: 3, status: 'broken' },
      { device_type_id: typeMap['철권 7'], device_number: 4, status: 'available' }
    ];
    
    const { error: deviceError } = await supabase
      .from('devices')
      .insert(devices);
    
    if (deviceError) {
      console.error('개별 기기 생성 실패:', deviceError);
      return;
    }
    console.log('✅ 개별 기기 생성 완료');
    
    console.log('🎉 기기 관리 시스템 설정 완료!');
    
  } catch (error) {
    console.error('마이그레이션 실패:', error);
  }
}

runMigration();