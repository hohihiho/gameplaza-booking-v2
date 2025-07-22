/**
 * Supabase 브라우저 클라이언트
 * 클라이언트 사이드에서 사용하는 Supabase 클라이언트입니다.
 */

import { createBrowserClient } from '@supabase/ssr'
import { getEnv } from '@/lib/config/env'
import type { Database } from './types'

// 싱글톤 클라이언트 인스턴스
let client: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * 브라우저용 Supabase 클라이언트 생성
 * @returns Supabase 클라이언트 인스턴스
 */
export function createClient() {
  if (client) return client
  
  const env = getEnv()
  
  client = createBrowserClient<Database>(
    env.supabase.url,
    env.supabase.anonKey,
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