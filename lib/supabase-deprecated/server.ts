/**
 * Supabase 서버 클라이언트
 * 서버 컴포넌트와 API 라우트에서 사용하는 Supabase 클라이언트입니다.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { auth } from '@/auth'
import { getEnv } from '@/lib/config/env'
import type { Database } from './types'

// JWT 캐시를 위한 간단한 메모리 저장소
const jwtCache = new Map<string, { token: string; expires: number }>()

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

  // NextAuth JWT를 Supabase에 전달 (캐시 적용)
  if (session?.user?.email) {
    const cacheKey = `${session.user.id || session.user.email}-${session.user.email}`
    const now = Math.floor(Date.now() / 1000)
    
    // 캐시된 토큰 확인 (만료 5분 전에 갱신)
    const cached = jwtCache.get(cacheKey)
    let supabaseJWT: string
    
    if (cached && cached.expires > now + 300) {
      // 캐시된 토큰 사용
      supabaseJWT = cached.token
    } else {
      // 새 토큰 생성 및 캐시 저장
      const jwt = await import('jsonwebtoken')
      const expires = now + (24 * 60 * 60) // 24시간
      
      supabaseJWT = jwt.sign(
        {
          aud: 'authenticated',
          exp: expires,
          sub: session.user.id || session.user.email,
          email: session.user.email,
          role: 'authenticated',
        },
        process.env.NEXTAUTH_SECRET!,
        { algorithm: 'HS256' }
      )
      
      // 캐시에 저장
      jwtCache.set(cacheKey, { token: supabaseJWT, expires })
      
      // 메모리 정리: 100개 이상 캐시되면 오래된 것 제거
      if (jwtCache.size > 100) {
        const entries = Array.from(jwtCache.entries())
        entries.sort((a, b) => a[1].expires - b[1].expires)
        entries.slice(0, 20).forEach(([key]) => jwtCache.delete(key))
      }
    }
    
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