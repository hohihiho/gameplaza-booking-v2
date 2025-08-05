const testData = {
  device_id: "beatmania IIDX #1",
  user_name: "테스트사용자",
  user_phone: "010-1234-5678",
  user_email: "test@example.com",
  date: "2025-08-05",
  start_hour: 9,
  end_hour: 10,
  time_slot_id: "fd0d5b06-6f07-4ea6-94f5-73bb6a13fd41", // 09:00-10:00 조기시간대
  purpose: "테스트"
};

// API 호출
fetch('http://localhost:3000/api/v2/reservations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log('응답 상태:', response.status);
  return response.json();
})
.then(data => {
  console.log('응답 데이터:', JSON.stringify(data, null, 2));
})
.catch(error => {
  console.error('오류:', error);
});