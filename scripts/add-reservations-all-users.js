// 모든 사용자에게 예약 데이터 추가
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addReservationsForAllUsers() {
  console.log('🚀 모든 사용자에게 예약 데이터 추가 시작...\n');
  
  try {
    // 모든 사용자 가져오기
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .order('created_at', { ascending: false });
    
    if (userError) {
      console.error('사용자 조회 실패:', userError);
      return;
    }
    
    console.log(`${users.length}명의 사용자를 찾았습니다`);
    
    // 기기 정보 가져오기
    const { data: devices, error: deviceError } = await supabase
      .from('devices')
      .select('id, device_number')
      .limit(10);
    
    if (deviceError || !devices || devices.length === 0) {
      console.error('기기 정보를 찾을 수 없습니다');
      return;
    }
    
    console.log(`${devices.length}개의 기기를 찾았습니다\n`);
    
    // 기존 예약 삭제 (선택사항)
    console.log('기존 예약 데이터 정리...');
    const { error: delError, count: delCount } = await supabase
      .from('reservations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 예약 삭제
    
    console.log(`${delCount || 0}개의 기존 예약 삭제됨\n`);
    
    const today = new Date();
    const allReservations = [];
    
    // 각 사용자별로 다양한 예약 생성
    users.forEach((user, userIdx) => {
      console.log(`📧 ${user.email} 처리 중...`);
      
      // 사용자별 예약 패턴 다르게 생성
      const patternType = userIdx % 3;
      
      if (patternType === 0) {
        // 패턴 1: 규칙적인 사용자 (매주 같은 시간)
        for (let week = -4; week <= 2; week++) {
          const date = new Date(today);
          date.setDate(date.getDate() + (week * 7));
          
          const status = week < 0 ? 'completed' : 
                        week === 0 ? 'approved' : 
                        'pending';
          
          allReservations.push({
            id: crypto.randomUUID(),
            user_id: user.id,
            device_id: devices[userIdx % devices.length].id,
            date: date.toISOString().split('T')[0],
            start_time: '19:00:00',
            end_time: '21:00:00',
            status: status,
            hourly_rate: 20000,
            total_amount: 40000,
            player_count: 2,
            user_notes: '정기 예약',
            created_at: new Date(date.getTime() - 86400000 * 3).toISOString()
          });
        }
      } else if (patternType === 1) {
        // 패턴 2: 불규칙한 사용자 (랜덤 날짜)
        const randomDates = [
          -15, -10, -5, -2, 1, 3, 7, 10
        ];
        
        randomDates.forEach((dayOffset, idx) => {
          const date = new Date(today);
          date.setDate(date.getDate() + dayOffset);
          
          const hour = 10 + (idx % 12);
          const status = dayOffset < 0 ? 'completed' : 
                        dayOffset < 3 ? 'approved' : 
                        'pending';
          
          allReservations.push({
            id: crypto.randomUUID(),
            user_id: user.id,
            device_id: devices[(userIdx + idx) % devices.length].id,
            date: date.toISOString().split('T')[0],
            start_time: `${hour}:00:00`,
            end_time: `${hour + 2}:00:00`,
            status: status,
            hourly_rate: 15000 + (idx * 2000),
            total_amount: (15000 + (idx * 2000)) * 2,
            player_count: idx % 2 === 0 ? 1 : 2,
            user_notes: idx === 0 ? '첫 방문' : null,
            created_at: new Date(date.getTime() - 86400000).toISOString()
          });
        });
      } else {
        // 패턴 3: 주말 집중 사용자
        for (let week = -3; week <= 2; week++) {
          // 토요일
          const saturday = new Date(today);
          const daysUntilSaturday = (6 - today.getDay() + 7) % 7;
          saturday.setDate(today.getDate() + daysUntilSaturday + (week * 7));
          
          const status = week < 0 ? 'completed' : 
                        week === 0 ? 'approved' : 
                        'pending';
          
          allReservations.push({
            id: crypto.randomUUID(),
            user_id: user.id,
            device_id: devices[userIdx % devices.length].id,
            date: saturday.toISOString().split('T')[0],
            start_time: '14:00:00',
            end_time: '17:00:00',
            status: status,
            hourly_rate: 25000,
            total_amount: 75000,
            player_count: 2,
            user_notes: '주말 예약',
            created_at: new Date(saturday.getTime() - 86400000 * 2).toISOString()
          });
          
          // 일요일도 추가
          const sunday = new Date(saturday);
          sunday.setDate(sunday.getDate() + 1);
          
          allReservations.push({
            id: crypto.randomUUID(),
            user_id: user.id,
            device_id: devices[(userIdx + 1) % devices.length].id,
            date: sunday.toISOString().split('T')[0],
            start_time: '15:00:00',
            end_time: '18:00:00',
            status: status,
            hourly_rate: 25000,
            total_amount: 75000,
            player_count: 2,
            user_notes: null,
            created_at: new Date(sunday.getTime() - 86400000 * 2).toISOString()
          });
        }
      }
    });
    
    console.log(`\n총 ${allReservations.length}개의 예약을 추가합니다...`);
    
    // 배치로 예약 추가
    const batchSize = 100;
    for (let i = 0; i < allReservations.length; i += batchSize) {
      const batch = allReservations.slice(i, i + batchSize);
      const { error } = await supabase
        .from('reservations')
        .insert(batch);
      
      if (error) {
        console.error(`❌ 배치 ${i / batchSize + 1} 추가 실패:`, error.message);
      } else {
        console.log(`✅ 배치 ${i / batchSize + 1} (${batch.length}개) 추가 완료`);
      }
    }
    
    // 최종 통계
    console.log('\n📊 최종 통계:');
    
    const { count: totalRes } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true });
    
    const { count: completedRes } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');
    
    const { count: approvedRes } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');
    
    const { count: pendingRes } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    console.log(`  📅 총 예약: ${totalRes}개`);
    console.log(`  ✅ 완료: ${completedRes}개`);
    console.log(`  ⏳ 승인: ${approvedRes}개`);
    console.log(`  🔄 대기: ${pendingRes}개`);
    
    // 사용자별 예약 수
    console.log('\n👥 사용자별 예약 수:');
    for (const user of users) {
      const { count } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      console.log(`  ${user.email}: ${count}개`);
    }
    
    console.log('\n✨ 예약 데이터 추가 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

addReservationsForAllUsers();