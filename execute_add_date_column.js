const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addDateColumn() {
  console.log('🔧 rental_time_slots 테이블 수정 시작...\n');

  try {
    // 1. 테이블 구조 확인
    const { data: checkData, error: checkError } = await supabase
      .from('rental_time_slots')
      .select('*')
      .limit(1);

    console.log('현재 테이블 구조:', checkData ? Object.keys(checkData[0] || {}) : 'Empty');

    // 2. 각 대여 가능한 기기에 대해 오늘부터 7일간의 시간대 생성
    console.log('\n📅 시간대 데이터 생성 중...\n');

    const { data: deviceTypes } = await supabase
      .from('device_types')
      .select('id, name, rental_settings')
      .eq('is_rentable', true);

    if (!deviceTypes || deviceTypes.length === 0) {
      console.log('❌ 대여 가능한 기기가 없습니다.');
      return;
    }

    // 날짜 배열 생성 (오늘부터 7일)
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    // 시간대 정의
    const timeSlots = [
      { start: '10:00:00', end: '14:00:00', type: 'regular' },
      { start: '14:00:00', end: '18:00:00', type: 'regular' },
      { start: '18:00:00', end: '22:00:00', type: 'regular' }
    ];

    let addedCount = 0;
    let errorCount = 0;

    for (const device of deviceTypes) {
      console.log(`\n🎮 ${device.name} 시간대 추가 중...`);
      
      for (const date of dates) {
        for (const slot of timeSlots) {
          const basePrice = device.rental_settings?.base_price || 50000;
          
          const slotData = {
            device_type_id: device.id,
            date: date,
            start_time: slot.start,
            end_time: slot.end,
            slot_type: slot.type,
            available_units: [1, 2, 3, 4],
            max_units: 4,
            price: basePrice,
            credit_options: [
              { type: 'freeplay', price: basePrice },
              { type: 'unlimited', price: Math.floor(basePrice * 1.2) }
            ],
            is_active: true
          };

          const { error } = await supabase
            .from('rental_time_slots')
            .insert(slotData);

          if (error) {
            if (error.code === '23505') { // duplicate key
              // 이미 존재하는 경우 업데이트
              const { error: updateError } = await supabase
                .from('rental_time_slots')
                .update({
                  available_units: slotData.available_units,
                  max_units: slotData.max_units,
                  price: slotData.price,
                  credit_options: slotData.credit_options,
                  is_active: slotData.is_active
                })
                .match({
                  device_type_id: device.id,
                  date: date,
                  start_time: slot.start,
                  end_time: slot.end
                });

              if (!updateError) {
                console.log(`  ✅ ${date} ${slot.start}-${slot.end} 업데이트`);
                addedCount++;
              } else {
                console.error(`  ❌ 업데이트 실패:`, updateError.message);
                errorCount++;
              }
            } else {
              console.error(`  ❌ 추가 실패:`, error.message);
              errorCount++;
            }
          } else {
            console.log(`  ✅ ${date} ${slot.start}-${slot.end} 추가`);
            addedCount++;
          }
        }
      }
    }

    // 3. 결과 확인
    console.log('\n📊 작업 결과:');
    console.log(`✅ 성공: ${addedCount}개`);
    console.log(`❌ 실패: ${errorCount}개`);

    // 4. 최종 데이터 확인
    const { data: finalCheck, count } = await supabase
      .from('rental_time_slots')
      .select('*', { count: 'exact', head: true })
      .gte('date', new Date().toISOString().split('T')[0]);

    console.log(`\n총 ${count}개의 활성 시간대가 있습니다.`);

    // 5. 샘플 데이터 출력
    const { data: sampleData } = await supabase
      .from('rental_time_slots')
      .select('*')
      .eq('date', new Date().toISOString().split('T')[0])
      .limit(3);

    console.log('\n오늘 날짜 샘플 데이터:');
    sampleData?.forEach(slot => {
      console.log(`- ${slot.start_time}-${slot.end_time}: ${slot.available_units.join(',')}번 기기 (₩${slot.price.toLocaleString()})`);
    });

  } catch (error) {
    console.error('전체 에러:', error);
  }
}

addDateColumn();