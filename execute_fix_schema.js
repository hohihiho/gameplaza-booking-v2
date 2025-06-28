const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function executeSQLFile() {
  try {
    console.log('🔧 DB 스키마 수정 시작...\n');
    
    // SQL 파일 읽기
    const sqlContent = fs.readFileSync('fix_rental_system_schema.sql', 'utf8');
    
    // SQL을 개별 명령으로 분리 (세미콜론으로 구분)
    const sqlCommands = sqlContent
      .split(/;(?=\s*(?:--|$|UPDATE|INSERT|ALTER|DO|CREATE|SELECT))/g)
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`총 ${sqlCommands.length}개의 SQL 명령 실행 예정\n`);

    // 각 명령 실행
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      console.log(`명령 ${i + 1}/${sqlCommands.length} 실행 중...`);
      
      try {
        // RPC로 raw SQL 실행
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: command + ';'
        });

        if (error) {
          // RPC가 없으면 직접 실행 시도
          if (error.message.includes('function') || error.message.includes('exec_sql')) {
            console.log('⚠️  RPC 함수가 없어서 다른 방법으로 시도합니다.');
            
            // UPDATE 문은 from()과 update()로 실행
            if (command.toUpperCase().startsWith('UPDATE')) {
              console.log('UPDATE 문은 수동으로 실행해야 합니다.');
            } else if (command.toUpperCase().includes('SELECT')) {
              console.log('SELECT 문 결과는 별도로 확인이 필요합니다.');
            }
          } else {
            console.error(`❌ 에러: ${error.message}`);
          }
        } else {
          console.log('✅ 성공');
        }
      } catch (err) {
        console.error(`❌ 실행 에러: ${err.message}`);
      }
    }

    console.log('\n🎯 개별 업데이트 작업 시작...\n');

    // device_types rental_settings 업데이트
    console.log('1. device_types rental_settings 업데이트...');
    const deviceUpdates = [
      {
        names: ['CHUNITHM', '사운드 볼텍스', 'BEATMANIA IIDX'],
        settings: {
          credit_types: ['freeplay', 'unlimited'],
          base_price: 50000,
          max_players: 1,
          price_multiplier_2p: 1
        }
      },
      {
        names: ['마이마이 DX'],
        settings: {
          credit_types: ['freeplay', 'unlimited'],
          base_price: 60000,
          max_players: 2,
          price_multiplier_2p: 1.5,
          max_rental_units: 3
        }
      }
    ];

    for (const update of deviceUpdates) {
      for (const name of update.names) {
        const { error } = await supabase
          .from('device_types')
          .update({ rental_settings: update.settings })
          .eq('name', name)
          .eq('is_rentable', true);
        
        if (error) {
          console.error(`❌ ${name} 업데이트 실패:`, error.message);
        } else {
          console.log(`✅ ${name} 업데이트 성공`);
        }
      }
    }

    // rental_time_slots에 테스트 데이터 추가
    console.log('\n2. rental_time_slots 테스트 데이터 추가...');
    
    // 대여 가능한 기기 타입 가져오기
    const { data: deviceTypes } = await supabase
      .from('device_types')
      .select('id, name, rental_settings')
      .eq('is_rentable', true);

    if (deviceTypes) {
      const dates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }

      const timeSlots = [
        { start: '10:00:00', end: '14:00:00' },
        { start: '14:00:00', end: '18:00:00' },
        { start: '18:00:00', end: '22:00:00' }
      ];

      for (const device of deviceTypes) {
        for (const date of dates) {
          for (const slot of timeSlots) {
            const basePrice = device.rental_settings?.base_price || 50000;
            
            const { error } = await supabase
              .from('rental_time_slots')
              .upsert({
                device_type_id: device.id,
                date: date,
                start_time: slot.start,
                end_time: slot.end,
                slot_type: 'regular',
                available_units: [1, 2, 3, 4],
                max_units: 4,
                price: basePrice,
                credit_options: [
                  { type: 'freeplay', price: basePrice },
                  { type: 'unlimited', price: Math.floor(basePrice * 1.2) }
                ],
                is_active: true
              }, {
                onConflict: 'device_type_id,date,start_time,end_time',
                ignoreDuplicates: true
              });

            if (!error) {
              console.log(`✅ ${device.name} - ${date} ${slot.start} 슬롯 추가`);
            }
          }
        }
      }
    }

    console.log('\n✅ DB 스키마 수정 완료!');

  } catch (error) {
    console.error('전체 에러:', error);
  }
}

executeSQLFile();