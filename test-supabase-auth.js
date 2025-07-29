// Supabase 인증 테스트 스크립트
const { createClient } = require('@supabase/supabase-js');

// 환경 변수 로드
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseKey ? 'Exists' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  try {
    // 기본 연결 테스트
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('Supabase 연결 실패:', error);
    } else {
      console.log('Supabase 연결 성공');
    }
    
    // 현재 세션 확인
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('세션 확인 실패:', sessionError);
    } else {
      console.log('현재 세션:', session);
    }
    
  } catch (error) {
    console.error('테스트 실패:', error);
  }
}

testSupabaseConnection();