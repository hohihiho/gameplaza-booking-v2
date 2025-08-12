// 불필요한 테스트 데이터 삭제하고 깔끔한 데이터 셋업
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 보존할 이메일 패턴
const keepEmails = [
  'user1@gameplaza.kr',
  'user2@gameplaza.kr',
  'user3@gameplaza.kr',
  'user4@gameplaza.kr',
  'user5@gameplaza.kr',
  'admin@gameplaza.kr',
  'super@gameplaza.kr'
];

// 추가할 완전한 테스트 사용자 (Auth 없이 users 테이블만)
const additionalUsers = [
  {
    email: 'test.kim@example.com',
    name: '김테스트',
    nickname: '테스트김',
    phone: '010-1234-5678',
    admin_notes: '테스트 계정 1'
  },
  {
    email: 'test.lee@example.com',
    name: '이테스트',
    nickname: '테스트이',
    phone: '010-2345-6789',
    admin_notes: '테스트 계정 2'
  },
  {
    email: 'test.park@example.com',
    name: '박테스트',
    nickname: '테스트박',
    phone: '010-3456-7890',
    admin_notes: '테스트 계정 3'
  },
  {
    email: 'banned.user@example.com',
    name: '차단사용자',
    nickname: '차단됨',
    phone: '010-0000-0000',
    is_blacklisted: true,
    admin_notes: '규정 위반으로 차단'
  },
  {
    email: 'noshow.user@example.com',
    name: '노쇼테스트',
    nickname: '노쇼',
    phone: '010-9999-9999',
    no_show_count: 3,
    admin_notes: '노쇼 3회 경고'
  }
];

async function cleanupAndSetup() {
  console.log('🧹 데이터 정리 시작...\n');
  
  try {
    // 1. 보존할 사용자 목록 확인
    console.log('📌 보존할 사용자:');
    const { data: keepUsers } = await supabase
      .from('users')
      .select('id, email, name')
      .in('email', keepEmails);
    
    const keepUserIds = keepUsers?.map(u => u.id) || [];
    keepUsers?.forEach(u => {
      console.log(`  ✅ ${u.email} - ${u.name}`);
    });
    
    // 2. 예약 데이터 백업 (보존할 사용자의 예약만)
    console.log('\n📦 예약 데이터 처리...');
    const { data: keepReservations } = await supabase
      .from('reservations')
      .select('id')
      .in('user_id', keepUserIds);
    
    console.log(`  - 보존할 예약: ${keepReservations?.length || 0}개`);
    
    // 3. 보존하지 않을 사용자의 예약 삭제
    const { error: delResError, count: delResCount } = await supabase
      .from('reservations')
      .delete()
      .not('user_id', 'in', `(${keepUserIds.join(',')})`);
    
    if (!delResError) {
      console.log(`  - 삭제된 예약: ${delResCount || 0}개`);
    }
    
    // 4. test*.com 패턴의 사용자 삭제
    console.log('\n🗑️  불필요한 테스트 사용자 삭제...');
    const { error: delUserError, count: delCount } = await supabase
      .from('users')
      .delete()
      .like('email', 'test%@example.com');
    
    if (!delUserError) {
      console.log(`  ✅ ${delCount || 0}명의 테스트 사용자 삭제됨`);
    }
    
    // 5. 추가 테스트 사용자 생성
    console.log('\n➕ 완전한 테스트 사용자 추가...');
    for (const userData of additionalUsers) {
      // 이미 존재하는지 확인
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .single();
      
      if (existing) {
        // 업데이트
        const { error } = await supabase
          .from('users')
          .update({
            name: userData.name,
            nickname: userData.nickname,
            phone: userData.phone,
            admin_notes: userData.admin_notes,
            is_blacklisted: userData.is_blacklisted || false,
            no_show_count: userData.no_show_count || 0
          })
          .eq('email', userData.email);
        
        if (!error) {
          console.log(`  📝 업데이트: ${userData.email}`);
        }
      } else {
        // 새로 생성
        const { error } = await supabase
          .from('users')
          .insert({
            id: crypto.randomUUID(),
            email: userData.email,
            name: userData.name,
            nickname: userData.nickname,
            phone: userData.phone,
            admin_notes: userData.admin_notes,
            is_blacklisted: userData.is_blacklisted || false,
            no_show_count: userData.no_show_count || 0,
            created_at: new Date().toISOString()
          });
        
        if (!error) {
          console.log(`  ✅ 생성: ${userData.email}`);
        } else {
          console.error(`  ❌ 실패: ${userData.email} - ${error.message}`);
        }
      }
    }
    
    // 6. 최종 통계
    console.log('\n📊 최종 데이터 통계:');
    const { data: finalUsers, count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: false });
    
    const { count: resCount } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true });
    
    console.log(`  👥 총 사용자: ${userCount}명`);
    console.log(`  📅 총 예약: ${resCount}개`);
    
    // 카테고리별 사용자 수
    const authUsers = finalUsers?.filter(u => keepEmails.includes(u.email)) || [];
    const testUsers = finalUsers?.filter(u => !keepEmails.includes(u.email)) || [];
    const bannedUsers = finalUsers?.filter(u => u.is_blacklisted) || [];
    
    console.log(`\n  🔐 Auth 사용자: ${authUsers.length}명`);
    console.log(`  🧪 테스트 사용자: ${testUsers.length}명`);
    console.log(`  🚫 차단된 사용자: ${bannedUsers.length}명`);
    
    console.log('\n✨ 데이터 정리 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 스크립트 실행
cleanupAndSetup();