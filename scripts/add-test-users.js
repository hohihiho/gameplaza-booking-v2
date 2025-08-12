// 테스트 사용자 데이터 추가 스크립트
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 테스트 사용자 데이터
const testUsers = [
  {
    email: 'test1@example.com',
    name: '김철수',
    nickname: '철수',
    phone: '010-1234-5678',
    is_blacklisted: false,
    admin_notes: '테스트 사용자 1'
  },
  {
    email: 'test2@example.com', 
    name: '이영희',
    nickname: '영희',
    phone: '010-2345-6789',
    is_blacklisted: false,
    admin_notes: '테스트 사용자 2'
  },
  {
    email: 'test3@example.com',
    name: '박민수',
    nickname: '민수',
    phone: '010-3456-7890',
    is_blacklisted: false,
    admin_notes: '테스트 사용자 3'
  },
  {
    email: 'test4@example.com',
    name: '최지원',
    nickname: '지원',
    phone: '010-4567-8901',
    is_blacklisted: false,
    admin_notes: '테스트 사용자 4'
  },
  {
    email: 'test5@example.com',
    name: '정다은',
    nickname: '다은',
    phone: '010-5678-9012',
    is_blacklisted: false,
    admin_notes: '테스트 사용자 5'
  },
  {
    email: 'test6@example.com',
    name: 'Alice Kim',
    nickname: 'Alice',
    phone: '010-6789-0123',
    is_blacklisted: false,
    admin_notes: '영문 이름 테스트'
  },
  {
    email: 'test7@example.com',
    name: 'Bob Lee',
    nickname: 'Bob',
    phone: '010-7890-1234',
    is_blacklisted: false,
    admin_notes: '영문 이름 테스트 2'
  },
  {
    email: 'banned@example.com',
    name: '차단된사용자',
    nickname: '차단',
    phone: '010-0000-0000',
    is_blacklisted: true,
    admin_notes: '규칙 위반으로 차단됨'
  },
  {
    email: 'noshow@example.com',
    name: '노쇼사용자',
    nickname: '노쇼',
    phone: '010-9999-9999',
    is_blacklisted: false,
    no_show_count: 3,
    admin_notes: '노쇼 3회 경고 필요'
  },
  {
    email: 'regular@example.com',
    name: '홍길동',
    nickname: '길동',
    phone: '010-1111-2222',
    is_blacklisted: false,
    admin_notes: '우수 고객'
  }
];

async function addTestUsers() {
  try {
    console.log('🚀 테스트 사용자 추가 시작...');
    
    for (const user of testUsers) {
      // 이미 존재하는지 확인
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();
      
      if (existingUser) {
        console.log(`⏭️  ${user.name} (${user.email}) - 이미 존재함`);
        continue;
      }
      
      // 새 사용자 추가 (UUID 포함)
      const newUser = {
        id: crypto.randomUUID(),
        ...user,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();
      
      if (error) {
        console.error(`❌ ${user.name} 추가 실패:`, error.message);
      } else {
        console.log(`✅ ${user.name} (${user.email}) 추가 완료`);
        
        // 일부 사용자에게 테스트 예약 추가
        if (['test1@example.com', 'test2@example.com', 'regular@example.com'].includes(user.email)) {
          await addTestReservations(data.id, user.name);
        }
      }
    }
    
    console.log('\n✨ 테스트 사용자 추가 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 테스트 예약 추가 함수
async function addTestReservations(userId, userName) {
  try {
    // 기기 정보 가져오기
    const { data: devices } = await supabase
      .from('devices')
      .select('id, device_number, device_type_id')
      .limit(3);
    
    if (!devices || devices.length === 0) {
      console.log(`  ⚠️  ${userName}: 기기 정보가 없어 예약을 추가할 수 없음`);
      return;
    }
    
    // 오늘부터 7일간의 날짜 생성
    const today = new Date();
    const reservations = [];
    
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      const reservation = {
        id: crypto.randomUUID(),
        user_id: userId,
        device_id: devices[i % devices.length].id,
        date: date.toISOString().split('T')[0],
        start_time: `${10 + i * 2}:00:00`,
        end_time: `${12 + i * 2}:00:00`,
        status: i === 0 ? 'approved' : i === 1 ? 'pending' : 'completed',
        total_amount: 30000,
        people_count: 2,
        notes: `테스트 예약 ${i + 1}`,
        created_at: new Date().toISOString()
      };
      
      reservations.push(reservation);
    }
    
    const { error } = await supabase
      .from('reservations')
      .insert(reservations);
    
    if (error) {
      console.log(`  ❌ ${userName}: 예약 추가 실패 -`, error.message);
    } else {
      console.log(`  ✅ ${userName}: ${reservations.length}개 예약 추가 완료`);
    }
    
  } catch (error) {
    console.error(`  ❌ ${userName}: 예약 추가 중 오류 -`, error);
  }
}

// 스크립트 실행
addTestUsers();