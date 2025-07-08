// 관리자 권한 확인 및 복구 스크립트
// 실행: node scripts/fix-admin.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('환경 변수가 설정되지 않았습니다.');
  console.log('필요한 환경 변수:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAndFixAdmin() {
  const targetEmail = 'ndz5496@gmail.com';
  
  console.log(`\n=== ${targetEmail} 관리자 권한 확인 및 복구 ===\n`);

  try {
    // 1. public.users 테이블에서 사용자 찾기
    console.log('1. users 테이블에서 사용자 검색...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', targetEmail)
      .single();

    if (userError || !userData) {
      console.error('❌ users 테이블에서 사용자를 찾을 수 없습니다.');
      console.log('   해당 이메일로 로그인하여 계정을 생성해주세요.');
      return;
    }

    console.log('✅ 사용자 찾음:', {
      id: userData.id,
      email: userData.email,
      nickname: userData.nickname,
      created_at: userData.created_at
    });

    // 2. 현재 관리자 권한 확인
    console.log('\n2. 현재 관리자 권한 확인...');
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', userData.id)
      .single();

    if (adminError && adminError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('❌ 관리자 테이블 조회 오류:', adminError);
      return;
    }

    if (adminData) {
      console.log('📋 현재 관리자 상태:', {
        role: adminData.role,
        created_at: adminData.created_at,
        updated_at: adminData.updated_at
      });

      if (adminData.role === 'super_admin') {
        console.log('✅ 이미 슈퍼관리자입니다!');
        return;
      }
    }

    // 3. 슈퍼관리자로 설정/업데이트
    console.log('\n3. 슈퍼관리자 권한 설정...');
    
    if (adminData) {
      // 업데이트
      const { error: updateError } = await supabase
        .from('admins')
        .update({ 
          role: 'super_admin',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userData.id);

      if (updateError) {
        console.error('❌ 업데이트 실패:', updateError);
        return;
      }
      console.log('✅ 슈퍼관리자로 업데이트 완료!');
    } else {
      // 새로 추가
      const { error: insertError } = await supabase
        .from('admins')
        .insert({
          user_id: userData.id,
          role: 'super_admin'
        });

      if (insertError) {
        console.error('❌ 추가 실패:', insertError);
        return;
      }
      console.log('✅ 슈퍼관리자로 추가 완료!');
    }

    // 4. 최종 확인
    console.log('\n4. 최종 확인...');
    const { data: finalCheck } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', userData.id)
      .single();

    if (finalCheck && finalCheck.role === 'super_admin') {
      console.log('✅ 슈퍼관리자 권한 설정 완료!');
      console.log('   이제 /admin/admins 페이지에 접근할 수 있습니다.');
    } else {
      console.log('❌ 권한 설정에 실패했습니다.');
    }

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

// 스크립트 실행
checkAndFixAdmin();