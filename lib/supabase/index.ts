/**
 * Supabase 클라이언트 통합 모듈
 * 모든 Supabase 관련 기능을 한 곳에서 관리합니다.
 */

// 클라이언트 exports
export { createClient, getClient } from './client'
export { createClient as createServerClient, createActionClient } from './server'
export { createAdminClient, getAdminClient } from './admin'

// 타입 exports
export * from './types'

// 헬퍼 함수들
import { isServer } from '@/lib/config/env'

/**
 * 현재 환경에 맞는 Supabase 클라이언트를 자동으로 선택
 * 서버: createServerClient 사용
 * 클라이언트: createClient 사용
 * 
 * @deprecated 명시적으로 클라이언트 타입을 선택하는 것을 권장합니다.
 */
export async function getSupabaseClient() {
  if (isServer()) {
    const { createClient } = await import('./server')
    return createClient()
  } else {
    const { createClient } = await import('./client')
    return createClient()
  }
}