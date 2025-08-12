// ndz5496을 슈퍼관리자로 설정하는 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function makeSuperAdmin() {
  console.log('슈퍼관리자 권한 설정 시작...\n');

  try {
    // 1. users 테이블에서 사용자 찾기
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', 'ndz5496@gmail.com')
      .single();

    if (userError || !user) {
      console.log('❌ 사용자를 찾을 수 없습니다:', userError?.message);
      return;
    }

    console.log('✅ 사용자 찾음:', user.email, '(', user.name, ')');

    // 2. 현재 admin 상태 확인
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.log('❌ 확인 중 오류:', checkError.message);
      return;
    }

    if (existingAdmin) {
      console.log('📋 현재 상태:', {
        is_super_admin: existingAdmin.is_super_admin,
        created_at: existingAdmin.created_at
      });

      // 3. is_super_admin을 true로 업데이트
      const { error: updateError } = await supabase
        .from('admins')
        .update({ 
          is_super_admin: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.log('❌ 업데이트 실패:', updateError.message);
        return;
      }

      console.log('✅ 슈퍼관리자로 업데이트 완료!');
    } else {
      // 4. 새로 추가
      const { error: insertError } = await supabase
        .from('admins')
        .insert({
          user_id: user.id,
          is_super_admin: true,
          permissions: {
            user_management: true,
            reservation_management: true,
            device_management: true,
            system_settings: true,
            admin_management: true
          }
        });

      if (insertError) {
        console.log('❌ 추가 실패:', insertError.message);
        return;
      }

      console.log('✅ 슈퍼관리자로 추가 완료!');
    }

    // 5. 최종 확인
    const { data: finalCheck } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (finalCheck) {
      console.log('\n✨ 최종 상태:');
      console.log('- is_super_admin:', finalCheck.is_super_admin);
      console.log('- permissions:', JSON.stringify(finalCheck.permissions, null, 2));
    }

  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error);
  }
}

makeSuperAdmin();