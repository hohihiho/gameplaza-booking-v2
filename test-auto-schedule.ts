import { ScheduleService } from './lib/services/schedule.service';

async function testAutoSchedule() {
  console.log('자동 스케줄 생성 테스트 시작...\n');

  // 18일 밤샘영업 예약에 대해 자동 스케줄 생성
  const reservationIds = [
    '8eeed302-302e-4e7c-9971-ff2db2665bee', // 밤샘영업 00:00-05:00
    'aed70f7c-2833-48fd-9f6a-dd7f506e3180'  // 밤샘영업 00:00-05:00
  ];

  for (const id of reservationIds) {
    console.log(`\n=== 예약 ID ${id} 처리 중 ===`);
    await ScheduleService.handleReservationApproved(id);
  }

  console.log('\n테스트 완료!');
}

testAutoSchedule().catch(console.error);