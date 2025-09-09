// 자동 스케줄 생성 테스트 스크립트
async function testAutoSchedule() {
  console.log('자동 스케줄 생성 테스트 시작...\n');

  // 18일 조기영업 예약 승인 테스트
  console.log('=== 조기영업 예약 승인 테스트 ===');
  const earlyResponse = await fetch('http://localhost:3000/api/admin/reservations', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: 'fff8a445-4858-4a86-ac46-f112ab068d9c',
      status: 'approved'
    })
  });

  const earlyResult = await earlyResponse.json();
  console.log('조기영업 예약 승인 결과:', earlyResult);
  console.log('\n');

  // 잠시 대기
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 18일 밤샘영업 예약 승인 테스트
  console.log('=== 밤샘영업 예약 승인 테스트 ===');
  const overnightResponse = await fetch('http://localhost:3000/api/admin/reservations', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: 'ee345666-62c6-4597-bddb-ebbfaae3e1f7',
      status: 'approved'
    })
  });

  const overnightResult = await overnightResponse.json();
  console.log('밤샘영업 예약 승인 결과:', overnightResult);
  console.log('\n');

  console.log('테스트 완료! 서버 콘솔에서 자동 스케줄 생성 로그를 확인하세요.');
}

testAutoSchedule().catch(console.error);