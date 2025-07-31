// 테스트용 예약 금액 업데이트 스크립트
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateReservationAmounts() {
  try {
    // 완료된 예약 조회 (금액 상관없이)
    const { data: allReservations, error: fetchAllError } = await supabase
      .from('reservations')
      .select('id, status, total_amount')
      .eq('status', 'completed')
      .limit(5);

    console.log('완료된 예약 현황:', allReservations);

    // null 금액인 예약만 조회
    const { data: reservations, error: fetchError } = await supabase
      .from('reservations')
      .select('id, status, total_amount')
      .eq('status', 'completed')
      .is('total_amount', null)
      .limit(10);

    if (fetchError) {
      console.error('예약 조회 오류:', fetchError);
      return;
    }

    console.log(`업데이트할 예약 수: ${reservations?.length || 0}`);

    if (!reservations || reservations.length === 0) {
      console.log('업데이트할 예약이 없습니다.');
      return;
    }

    // 각 예약에 랜덤 금액 설정 (1000원~5000원)
    for (const reservation of reservations) {
      const randomAmount = Math.floor(Math.random() * 4000) + 1000; // 1000~5000원
      
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ total_amount: randomAmount })
        .eq('id', reservation.id);

      if (updateError) {
        console.error(`예약 ${reservation.id} 업데이트 오류:`, updateError);
      } else {
        console.log(`예약 ${reservation.id}: ${randomAmount}원 설정 완료`);
      }
    }

    console.log('예약 금액 업데이트 완료!');
  } catch (error) {
    console.error('스크립트 실행 오류:', error);
  }
}

updateReservationAmounts();