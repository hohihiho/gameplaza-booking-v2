import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 랜덤 데이터 생성 함수들
const getRandomNoShowCount = () => Math.floor(Math.random() * 5); // 0-4회

const adminNotes = [
  '친절하고 매너가 좋은 회원입니다.',
  '자주 방문하는 VIP 고객입니다.',
  '예약 시간을 잘 지키는 모범 회원',
  '게임 실력이 뛰어난 프로 게이머',
  '초보자지만 열정적으로 게임을 즐깁니다.',
  '단골 손님으로 매주 방문합니다.',
  '기기 사용에 능숙한 회원',
  '친구들과 함께 자주 방문',
  '심야 시간대 주로 이용',
  '주말마다 정기적으로 방문',
  '대회 참가 경험이 있는 실력자',
  '스트리밍 방송을 하는 회원',
  '학생 회원 - 시험기간 제외하고 자주 방문',
  '직장인 회원 - 퇴근 후 저녁시간 주로 이용',
  '예약 변경이 잦은 편',
  '그룹 예약을 자주 하는 회원',
  '신규 게임에 관심이 많음',
  '레트로 게임을 선호하는 회원',
  '격투 게임 마니아',
  'RPG 게임을 좋아하는 회원'
];

const getRandomAdminNote = () => {
  const shouldHaveNote = Math.random() > 0.3; // 70% 확률로 메모 있음
  if (!shouldHaveNote) return null;
  return adminNotes[Math.floor(Math.random() * adminNotes.length)];
};

// 예약 상태
const reservationStatuses = ['pending', 'approved', 'checked_in', 'cancelled', 'rejected'];

// 게임 기기 타입 (실제 데이터베이스에서 가져와야 함)
const deviceTypes = [
  { id: 1, name: 'PlayStation 5', hourly_rate: 5000 },
  { id: 2, name: 'Xbox Series X', hourly_rate: 5000 },
  { id: 3, name: 'Nintendo Switch', hourly_rate: 3000 },
  { id: 4, name: 'Gaming PC', hourly_rate: 7000 }
];

// 랜덤 날짜 생성 (최근 6개월)
const getRandomDate = () => {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - (180 * 24 * 60 * 60 * 1000));
  const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
  return new Date(randomTime);
};

// 랜덤 시간 슬롯 생성
const getRandomTimeSlot = () => {
  const startHour = Math.floor(Math.random() * 20) + 10; // 10시-29시
  const duration = Math.floor(Math.random() * 3) + 1; // 1-3시간
  const endHour = startHour + duration;
  
  return {
    start_time: `${startHour}:00:00`,
    end_time: `${endHour}:00:00`,
    duration
  };
};

async function populateTestData() {
  try {
    console.log('테스트 데이터 생성 시작...');

    // 1. 모든 사용자 가져오기
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('사용자 조회 실패:', usersError);
      return;
    }

    console.log(`${users.length}명의 사용자를 찾았습니다.`);

    // 2. 각 사용자에 대해 데이터 업데이트
    for (const user of users) {
      // 관리자나 특정 계정은 제외
      if (user.email === 'ndz5496@gmail.com') continue;

      // 노쇼 횟수와 관리자 메모 업데이트
      const updates = {
        no_show_count: getRandomNoShowCount(),
        admin_notes: getRandomAdminNote()
      };

      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (updateError) {
        console.error(`사용자 ${user.name} 업데이트 실패:`, updateError);
        continue;
      }

      console.log(`사용자 ${user.name} 업데이트 완료`);

      // 3. 예약 데이터 생성 (각 사용자당 0-10개)
      const reservationCount = Math.floor(Math.random() * 11);
      
      for (let i = 0; i < reservationCount; i++) {
        const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
        const timeSlot = getRandomTimeSlot();
        const date = getRandomDate();
        const status = reservationStatuses[Math.floor(Math.random() * reservationStatuses.length)];
        
        // 기기 선택 (실제로는 devices 테이블에서 가져와야 함)
        const { data: devices } = await supabase
          .from('devices')
          .select('id')
          .eq('device_type_id', deviceType.id)
          .limit(1)
          .single();

        if (!devices) continue;

        const reservation = {
          user_id: user.id,
          device_id: devices.id,
          date: date.toISOString().split('T')[0],
          start_time: timeSlot.start_time,
          end_time: timeSlot.end_time,
          status: status,
          total_price: deviceType.hourly_rate * timeSlot.duration,
          created_at: date.toISOString()
        };

        const { error: reservationError } = await supabase
          .from('reservations')
          .insert(reservation);

        if (reservationError) {
          console.error(`예약 생성 실패:`, reservationError);
        }
      }

      console.log(`사용자 ${user.name}에 ${reservationCount}개의 예약 생성 완료`);
    }

    // 4. 일부 사용자를 관리자로 설정
    const adminCandidates = users.slice(5, 10); // 5번째부터 10번째 사용자
    for (const admin of adminCandidates) {
      const { error: adminError } = await supabase
        .from('admins')
        .insert({
          user_id: admin.id,
          is_super_admin: false
        });

      if (adminError && adminError.code !== '23505') { // 중복 키 에러 무시
        console.error(`관리자 설정 실패:`, adminError);
      } else {
        console.log(`${admin.name}을(를) 관리자로 설정`);
      }
    }

    // 5. 일부 사용자를 차단
    const bannedCandidates = users.slice(15, 20); // 15번째부터 20번째 사용자
    for (const banned of bannedCandidates) {
      const { error: banError } = await supabase
        .from('users')
        .update({ is_blacklisted: true })
        .eq('id', banned.id);

      if (banError) {
        console.error(`차단 설정 실패:`, banError);
      } else {
        console.log(`${banned.name}을(를) 차단 설정`);
      }
    }

    console.log('테스트 데이터 생성 완료!');
  } catch (error) {
    console.error('테스트 데이터 생성 중 오류:', error);
  }
}

// 스크립트 실행
populateTestData();