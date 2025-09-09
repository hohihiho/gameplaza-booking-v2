// 서버 사이드 인증 테스트
const { createServerClient } = require('@supabase/ssr');
const { cookies } = require('next/headers');

// 환경 변수 로드
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 더미 쿠키 객체 생성
const dummyCookies = {
  get: () => null,
  set: () => {},
  delete: () => {}
};

async function testServerAuth() {
  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name) {
          return dummyCookies.get(name);
        },
        set(name, value, options) {
          dummyCookies.set(name, value, options);
        },
        remove(name, options) {
          dummyCookies.delete(name, options);
        },
      },
    });

    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('인증 에러:', error);
    } else {
      console.log('사용자 정보:', user);
    }
  } catch (error) {
    console.error('서버 인증 테스트 실패:', error);
  }
}

testServerAuth();