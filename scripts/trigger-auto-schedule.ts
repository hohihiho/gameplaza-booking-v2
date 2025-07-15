#!/usr/bin/env node

import { ScheduleService } from '../lib/services/schedule.service.js';

// 18일 예약에 대해 자동 스케줄 생성 트리거
async function triggerAutoSchedule() {
  const reservationIds = [
    'fff8a445-4858-4a86-ac46-f112ab068d9c', // 조기영업 08:00-12:00
    'ee345666-62c6-4597-bddb-ebbfaae3e1f7'  // 밤샘영업 00:00-05:00
  ];

  console.log('자동 스케줄 생성 시작...');

  for (const id of reservationIds) {
    console.log(`\n예약 ID ${id} 처리 중...`);
    await ScheduleService.handleReservationApproved(id);
  }

  console.log('\n자동 스케줄 생성 완료!');
  process.exit(0);
}

triggerAutoSchedule().catch(error => {
  console.error('에러 발생:', error);
  process.exit(1);
});