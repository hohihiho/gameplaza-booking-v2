import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    
    // OAuth 코드를 세션으로 교환
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // 로그인 성공 - 사용자 정보 확인
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // users 테이블에 사용자 정보가 있는지 확인
        const { data: profile } = await supabase.from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        
        // 프로필이 없으면 처음 로그인하는 사용자 - 회원가입 페이지로
        if (!profile) {
          return NextResponse.redirect(new URL('/signup', requestUrl.origin))
        }
        
        // 프로필이 있으면 홈으로
        return NextResponse.redirect(new URL('/', requestUrl.origin))
      }
    }
  }

  // 오류가 있으면 로그인 페이지로
  return NextResponse.redirect(new URL('/login?error=auth', requestUrl.origin))
}