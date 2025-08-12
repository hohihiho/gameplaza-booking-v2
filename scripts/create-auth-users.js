// Supabase Auth에 테스트 사용자 생성
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 테스트 사용자 계정 (Auth + users 테이블)
const testUsers = [
  {
    email: 'user1@gameplaza.kr',
    password: 'test1234!',
    name: '김민수',
    nickname: '민수',
    phone: '010-1111-1111',
    admin_notes: '우수 고객, 예약 활발'
  },
  {
    email: 'user2@gameplaza.kr',
    password: 'test1234!',
    name: '이지은',
    nickname: '지은',
    phone: '010-2222-2222',
    admin_notes: '신규 회원'
  },
  {
    email: 'user3@gameplaza.kr',
    password: 'test1234!',
    name: '박서준',
    nickname: '서준',
    phone: '010-3333-3333',
    admin_notes: '주말 이용 선호'
  },
  {
    email: 'user4@gameplaza.kr',
    password: 'test1234!',
    name: '최유나',
    nickname: '유나',
    phone: '010-4444-4444',
    admin_notes: '그룹 예약 자주 함'
  },
  {
    email: 'user5@gameplaza.kr',
    password: 'test1234!',
    name: '정태영',
    nickname: '태영',
    phone: '010-5555-5555',
    admin_notes: '야간 시간대 선호'
  }
];

async function createAuthUsers() {
  console.log('🚀 Auth 사용자 생성 시작...');
  
  for (const userData of testUsers) {
    try {
      // 1. Auth 사용자 생성
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true
      });
      
      if (authError) {
        if (authError.message?.includes('already been registered')) {
          console.log(`⏭️  ${userData.email} - 이미 존재하는 Auth 사용자`);
          
          // 기존 Auth 사용자 ID 가져오기
          const { data: { users } } = await supabase.auth.admin.listUsers();
          const existingUser = users.find(u => u.email === userData.email);
          
          if (existingUser) {
            // users 테이블에만 추가
            await updateUsersTable(existingUser.id, userData);
          }
          continue;
        }
        console.error(`❌ Auth 사용자 생성 실패 (${userData.email}):`, authError.message);
        continue;
      }
      
      console.log(`✅ Auth 사용자 생성: ${userData.email}`);
      
      // 2. users 테이블에 정보 추가
      await updateUsersTable(authUser.user.id, userData);
      
    } catch (error) {
      console.error(`❌ 오류 발생 (${userData.email}):`, error);
    }
  }
  
  console.log('\n✨ 테스트 사용자 생성 완료!');
  console.log('테스트 계정으로 로그인 가능:');
  testUsers.forEach(user => {
    console.log(`  📧 ${user.email} / 🔑 ${user.password}`);
  });
}

async function updateUsersTable(userId, userData) {
  // users 테이블에 있는지 확인
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();
  
  if (existingUser) {
    // 업데이트
    const { error } = await supabase
      .from('users')
      .update({
        name: userData.name,
        nickname: userData.nickname,
        phone: userData.phone,
        admin_notes: userData.admin_notes
      })
      .eq('id', userId);
    
    if (error) {
      console.error(`  ❌ users 테이블 업데이트 실패:`, error.message);
    } else {
      console.log(`  ✅ users 테이블 업데이트: ${userData.name}`);
    }
  } else {
    // 삽입
    const { error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: userData.email,
        name: userData.name,
        nickname: userData.nickname,
        phone: userData.phone,
        admin_notes: userData.admin_notes,
        is_blacklisted: false,
        no_show_count: 0,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error(`  ❌ users 테이블 추가 실패:`, error.message);
    } else {
      console.log(`  ✅ users 테이블 추가: ${userData.name}`);
    }
  }
}

// 스크립트 실행
createAuthUsers();