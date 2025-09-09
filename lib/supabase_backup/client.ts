/**
 * Supabase 브라우저 클라이언트
 * 클라이언트 사이드에서 사용하는 Supabase 클라이언트입니다.
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

// 싱글톤 클라이언트 인스턴스
let client: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * 브라우저용 Supabase 클라이언트 생성
 * @returns Supabase 클라이언트 인스턴스
 */
export function createClient() {
  if (client) return client
  
  // 직접 환경 변수 사용 (Next.js가 빌드 타임에 치환)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  client = createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'x-application-name': 'gameplaza-web',
        },
      },
    }
  )
  
  return client
}

/**
 * 기존 클라이언트 인스턴스 가져오기
 * @returns 기존 클라이언트 인스턴스 또는 새로 생성
 */
export function getClient() {
  return client || createClient()
}