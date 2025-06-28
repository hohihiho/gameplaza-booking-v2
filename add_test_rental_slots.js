const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addTestRentalSlots() {
  console.log('🎮 테스트용 대여 시간대 추가 시작...\n');

  try {
    // 대여 가능한 기기 타입 가져오기
    const { data: deviceTypes, error: dtError } = await supabase
      .from('device_types')
      .select('id, name, rental_settings')
      .eq('is_rentable', true);

    if (dtError) throw dtError;

    if (!deviceTypes || deviceTypes.length === 0) {
      console.log('❌ 대여 가능한 기기가 없습니다.');
      return;
    }

    console.log(`✅ ${deviceTypes.length}개의 대여 가능한 기기 발견\n`);

    for (const device of deviceTypes) {
      console.log(`📱 ${device.name} 시간대 추가 중...`);

      // 조기 대여 시간대 (10:00 ~ 18:00)
      const earlySlot = {
        device_type_id: device.id,
        slot_type: 'early',
        start_time: '10:00:00',
        end_time: '18:00:00',
        credit_options: [],
        enable_2p: false,
        price_2p_extra: null,
        is_youth_time: true
      };

      // 크레딧 옵션 설정
      const creditTypes = device.rental_settings?.credit_types || ['freeplay'];
      const basePrice = device.rental_settings?.base_price || 50000;

      if (creditTypes.includes('fixed')) {
        earlySlot.credit_options.push({
          type: 'fixed',
          price: Math.floor(basePrice * 0.6), // 조기대여 할인
          fixed_credits: device.rental_settings?.fixed_credits || 100
        });
      }

      if (creditTypes.includes('freeplay')) {
        earlySlot.credit_options.push({
          type: 'freeplay',
          price: Math.floor(basePrice * 0.6) // 조기대여 할인
        });
      }

      if (creditTypes.includes('unlimited')) {
        earlySlot.credit_options.push({
          type: 'unlimited',
          price: Math.floor(basePrice * 0.7) // 조기대여 할인
        });
      }

      // 2인 플레이 설정
      if (device.rental_settings?.max_players > 1) {
        earlySlot.enable_2p = true;
        earlySlot.price_2p_extra = 10000;
      }

      // 조기 대여 추가
      const { error: earlyError } = await supabase
        .from('rental_time_slots')
        .insert(earlySlot);

      if (earlyError) {
        console.error(`  ❌ 조기대여 추가 실패:`, earlyError.message);
      } else {
        console.log(`  ✅ 조기대여 시간대 추가 완료`);
      }

      // 밤샘 대여 시간대 (22:00 ~ 익일 08:00)
      const overnightSlot = {
        device_type_id: device.id,
        slot_type: 'overnight',
        start_time: '22:00:00',
        end_time: '08:00:00',
        credit_options: [],
        enable_2p: false,
        price_2p_extra: null,
        is_youth_time: false
      };

      // 밤샘 대여 크레딧 옵션
      if (creditTypes.includes('fixed')) {
        overnightSlot.credit_options.push({
          type: 'fixed',
          price: Math.floor(basePrice * 0.8), // 밤샘대여 할인
          fixed_credits: (device.rental_settings?.fixed_credits || 100) * 2 // 크레딧 2배
        });
      }

      if (creditTypes.includes('freeplay')) {
        overnightSlot.credit_options.push({
          type: 'freeplay',
          price: Math.floor(basePrice * 0.8) // 밤샘대여 할인
        });
      }

      if (creditTypes.includes('unlimited')) {
        overnightSlot.credit_options.push({
          type: 'unlimited',
          price: basePrice // 정가
        });
      }

      // 2인 플레이 설정
      if (device.rental_settings?.max_players > 1) {
        overnightSlot.enable_2p = true;
        overnightSlot.price_2p_extra = 15000;
      }

      // 밤샘 대여 추가
      const { error: overnightError } = await supabase
        .from('rental_time_slots')
        .insert(overnightSlot);

      if (overnightError) {
        console.error(`  ❌ 밤샘대여 추가 실패:`, overnightError.message);
      } else {
        console.log(`  ✅ 밤샘대여 시간대 추가 완료`);
      }

      console.log('');
    }

    // 최종 확인
    const { data: totalSlots, count } = await supabase
      .from('rental_time_slots')
      .select('*', { count: 'exact', head: true });

    console.log(`\n✅ 총 ${count}개의 대여 시간대가 설정되었습니다.`);

  } catch (error) {
    console.error('전체 에러:', error);
  }
}

addTestRentalSlots();