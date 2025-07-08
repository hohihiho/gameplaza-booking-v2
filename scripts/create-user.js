// 사용자 계정 생성 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function createUser() {
  const email = 'ndz5496@gmail.com';
  
  console.log(`\n=== ${email} 사용자 계정 생성 ===\n`);

  try {
    // 1. 기존 사용자 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      console.log('✅ 이미 사용자가 존재합니다:', existingUser);
      return;
    }

    // 2. 새 사용자 생성
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: email,
        nickname: '관리자',
        phone: '010-0000-0000', // 임시 번호
        is_active: true,
        is_admin: true,
        // 다른 필드들은 기본값 사용
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ 사용자 생성 실패:', createError);
      return;
    }

    console.log('✅ 사용자 계정 생성 완료!');
    console.log('생성된 사용자:', newUser);

    // 3. 관리자 권한 확인
    const { data: adminCheck } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', newUser.id)
      .single();

    if (adminCheck) {
      console.log('✅ 관리자 권한도 확인되었습니다!');
    }

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

createUser();