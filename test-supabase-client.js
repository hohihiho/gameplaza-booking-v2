// Supabase JS 클라이언트 테스트
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.test' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔧 환경 변수 확인:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length
})

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testInsert() {
  try {
    console.log('📝 사용자 삽입 테스트 시작...')
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: `test-client-${Date.now()}`,
        email: `test-client-${Date.now()}@example.com`,
        full_name: '클라이언트 테스트',
        phone: '010-9999-9999',
        birth_date: '2000-01-01',
        status: 'active',
        marketing_agreed: false
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ 삽입 실패:', error)
    } else {
      console.log('✅ 삽입 성공:', data)
    }
  } catch (err) {
    console.error('💥 예외 발생:', err)
  }
}

testInsert()