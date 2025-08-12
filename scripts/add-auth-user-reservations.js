// Auth 사용자들에게 예약 데이터 추가
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addReservationsForAuthUsers() {
  console.log('🚀 Auth 사용자 예약 추가 시작...');
  
  try {
    // Auth 사용자들 찾기
    const emails = [
      'user1@gameplaza.kr',
      'user2@gameplaza.kr',
      'user3@gameplaza.kr',
      'user4@gameplaza.kr',
      'user5@gameplaza.kr'
    ];
    
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .in('email', emails);
    
    if (userError) {
      console.error('사용자 조회 실패:', userError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('Auth 사용자를 찾을 수 없습니다. create-auth-users.js를 먼저 실행하세요.');
      return;
    }
    
    console.log(`${users.length}명의 Auth 사용자를 찾았습니다`);
    
    // 기기 정보 가져오기
    const { data: devices, error: deviceError } = await supabase
      .from('devices')
      .select('id, device_number')
      .limit(10);
    
    if (deviceError || !devices || devices.length === 0) {
      console.error('기기 정보를 찾을 수 없습니다');
      return;
    }
    
    console.log(`${devices.length}개의 기기를 찾았습니다`);
    
    const today = new Date();
    const reservations = [];
    
    // 각 사용자별로 다양한 예약 생성
    users.forEach((user, userIdx) => {
      const userReservations = [];
      
      // 완료된 예약 (과거)
      for (let i = 0; i < 3; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (10 - i * 3));
        
        userReservations.push({
          id: crypto.randomUUID(),
          user_id: user.id,
          device_id: devices[i % devices.length].id,
          date: date.toISOString().split('T')[0],
          start_time: `${14 + i * 2}:00:00`,
          end_time: `${16 + i * 2}:00:00`,
          status: 'completed',
          hourly_rate: 15000,
          total_amount: 30000,
          player_count: i % 2 === 0 ? 2 : 1,
          user_notes: `${user.name}님의 ${i + 1}번째 예약`,
          created_at: new Date(date.getTime() - 86400000).toISOString()
        });
      }
      
      // 승인된 예약 (미래)
      for (let i = 0; i < 2; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + (i + 1) * 2);
        
        userReservations.push({
          id: crypto.randomUUID(),
          user_id: user.id,
          device_id: devices[(userIdx + i) % devices.length].id,
          date: date.toISOString().split('T')[0],
          start_time: `${10 + i * 3}:00:00`,
          end_time: `${12 + i * 3}:00:00`,
          status: 'approved',
          hourly_rate: 20000,
          total_amount: 40000,
          player_count: 2,
          user_notes: i === 0 ? '친구와 함께' : null,
          created_at: new Date().toISOString()
        });
      }
      
      // 대기중인 예약 (미래)
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 7);
      
      userReservations.push({
        id: crypto.randomUUID(),
        user_id: user.id,
        device_id: devices[userIdx % devices.length].id,
        date: futureDate.toISOString().split('T')[0],
        start_time: '18:00:00',
        end_time: '20:00:00',
        status: 'pending',
        hourly_rate: 25000,
        total_amount: 50000,
        player_count: 2,
        user_notes: '주말 예약',
        created_at: new Date().toISOString()
      });
      
      reservations.push(...userReservations);
    });
    
    console.log(`총 ${reservations.length}개의 예약을 추가합니다...`);
    
    // 예약 추가
    const { error } = await supabase
      .from('reservations')
      .insert(reservations);
    
    if (error) {
      console.error('❌ 예약 추가 실패:', error.message);
      console.error('상세 오류:', error);
    } else {
      console.log(`✅ ${reservations.length}개 예약 추가 완료!`);
      
      // 사용자별 예약 수 출력
      users.forEach(user => {
        const userResCount = reservations.filter(r => r.user_id === user.id).length;
        console.log(`  📧 ${user.email}: ${userResCount}개 예약`);
      });
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

addReservationsForAuthUsers();