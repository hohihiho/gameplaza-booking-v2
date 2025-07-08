// 빠른 관리자 권한 복구
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function quickFix() {
  console.log('관리자 권한 빠른 복구 시작...\n');

  // 1. admins 테이블 확인
  const { data: checkTable, error: checkError } = await supabase
    .from('admins')
    .select('*')
    .limit(1);

  if (checkError && checkError.message.includes("relation")) {
    console.log('❌ admins 테이블이 없습니다. Supabase 대시보드에서 다음 SQL을 실행하세요:\n');
    console.log(`CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view admins" ON admins FOR SELECT USING (true);`);
    return;
  }

  // 2. users 테이블에서 사용자 찾기
  const { data: user } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', 'ndz5496@gmail.com')
    .single();

  if (!user) {
    console.log('❌ 사용자를 찾을 수 없습니다.');
    return;
  }

  console.log('✅ 사용자 찾음:', user.email);

  // 3. 기존 admin 레코드 삭제 (role 컬럼 문제 회피)
  await supabase
    .from('admins')
    .delete()
    .eq('user_id', user.id);

  // 4. 새로 추가
  const { error: insertError } = await supabase
    .from('admins')
    .insert({
      user_id: user.id,
      // role 컬럼이 있으면 사용, 없으면 무시
      ...(checkTable && checkTable[0] && 'role' in checkTable[0] ? { role: 'super_admin' } : {})
    });

  if (insertError) {
    console.log('❌ 추가 실패:', insertError.message);
    
    // role 컬럼이 없다면 기본값으로 추가
    console.log('\n다시 시도 (role 없이)...');
    const { error: retryError } = await supabase
      .from('admins')
      .insert({ user_id: user.id });
    
    if (retryError) {
      console.log('❌ 재시도 실패:', retryError.message);
    } else {
      console.log('✅ 관리자로 추가 완료!');
      console.log('\n⚠️  role 컬럼이 없어서 일반 관리자로 추가되었습니다.');
      console.log('Supabase 대시보드에서 다음 SQL을 실행하여 슈퍼관리자로 변경하세요:');
      console.log(`\nALTER TABLE admins ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin';
UPDATE admins SET role = 'super_admin' WHERE user_id = '${user.id}';`);
    }
  } else {
    console.log('✅ 슈퍼관리자 권한 설정 완료!');
  }
}

quickFix();