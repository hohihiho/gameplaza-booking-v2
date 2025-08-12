// 기존 사용자에게 테스트 예약 추가
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addReservationsToExistingUsers() {
  try {
    console.log('🚀 예약 추가 시작...');
    
    // 기존 테스트 사용자들 찾기
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .limit(10);
    
    if (userError) {
      console.error('사용자 조회 실패:', userError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('사용자를 찾을 수 없음');
      return;
    }
    
    console.log(`${users.length}명의 사용자를 찾았습니다`);
    
    // 기기 정보 가져오기
    const { data: devices, error: deviceError } = await supabase
      .from('devices')
      .select('id, device_number')
      .limit(5);
    
    if (deviceError) {
      console.error('기기 조회 실패:', deviceError);
      return;
    }
    
    if (!devices || devices.length === 0) {
      console.log('기기를 찾을 수 없음');
      return;
    }
    
    console.log(`${devices.length}개의 기기를 찾았습니다`);
    
    const today = new Date();
    const reservations = [];
    
    // 각 사용자에게 2-3개의 예약 추가
    for (let userIdx = 0; userIdx < Math.min(users.length, 5); userIdx++) {
      const user = users[userIdx];
      const numReservations = Math.floor(Math.random() * 2) + 2; // 2-3개
      
      for (let i = 0; i < numReservations; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - 7 + i * 3); // 지난 주부터 미래까지
        
        const hour = 10 + (i * 3);
        const status = date < today ? 'completed' : 
                      (Math.random() > 0.5 ? 'approved' : 'pending');
        
        const hourlyRate = 15000 + (i * 5000);
        const hours = 2;
        
        reservations.push({
          id: crypto.randomUUID(),
          user_id: user.id,
          device_id: devices[i % devices.length].id,
          date: date.toISOString().split('T')[0],
          start_time: `${hour}:00:00`,
          end_time: `${hour + hours}:00:00`,
          status: status,
          hourly_rate: hourlyRate,
          total_amount: hourlyRate * hours,
          player_count: Math.random() > 0.5 ? 2 : 1, // 1명 또는 2명
          user_notes: i === 0 ? '첫 예약입니다' : null,
          created_at: new Date().toISOString()
        });
      }
    }
    
    console.log(`총 ${reservations.length}개의 예약을 추가합니다...`);
    
    // 예약 추가
    const { error } = await supabase
      .from('reservations')
      .insert(reservations);
    
    if (error) {
      console.error('❌ 예약 추가 실패:', error.message);
    } else {
      console.log(`✅ ${reservations.length}개 예약 추가 완료!`);
      
      // 추가된 예약 정보 출력
      const userNames = [...new Set(reservations.map(r => {
        const user = users.find(u => u.id === r.user_id);
        return user ? user.name : 'Unknown';
      }))];
      
      console.log('예약이 추가된 사용자:', userNames.join(', '));
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

addReservationsToExistingUsers();