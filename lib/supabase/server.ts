/**
 * Supabase 서버 클라이언트
 * 서버 컴포넌트와 API 라우트에서 사용하는 Supabase 클라이언트입니다.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { auth } from '@/auth'
import { getEnv } from '@/lib/config/env'
import type { Database } from './types'

/**
 * 서버용 Supabase 클라이언트 생성
 * NextAuth 세션과 통합되어 있습니다.
 * @returns Supabase 클라이언트 인스턴스
 */
export async function createClient() {
  const cookieStore = await cookies()
  const session = await auth()
  const env = getEnv()

  const supabase = createServerClient<Database>(
    env.supabase.url,
    env.supabase.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      global: {
        headers: {
          'x-application-name': 'gameplaza-server',
        },
      },
    }
  )

  // NextAuth JWT를 Supabase에 전달
  if (session?.user?.email) {
    // NextAuth 토큰에서 Supabase 호환 JWT 생성
    const jwt = await import('jsonwebtoken')
    const supabaseJWT = jwt.sign(
      {
        aud: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        sub: session.user.id || session.user.email,
        email: session.user.email,
        role: 'authenticated',
      },
      process.env.NEXTAUTH_SECRET!,
      { algorithm: 'HS256' }
    )
    
    // Supabase 세션 설정
    await supabase.auth.setSession({
      access_token: supabaseJWT,
      refresh_token: 'dummy_refresh_token'
    })
  }

  return supabase
}

/**
 * 서버 액션용 Supabase 클라이언트 생성
 * Server Actions에서 사용하기 위한 헬퍼 함수
 * @returns Supabase 클라이언트 인스턴스
 */
export async function createActionClient() {
  return createClient()
}