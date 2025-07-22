/**
 * Supabase 관리자 클라이언트
 * Service Role Key를 사용하여 RLS를 우회합니다.
 * 서버 사이드에서만 사용해야 합니다!
 */

import { createClient } from '@supabase/supabase-js'
import { getEnv, isServer } from '@/lib/config/env'
import type { Database } from './types'

// 싱글톤 관리자 클라이언트
let adminClient: ReturnType<typeof createClient<Database>> | null = null

/**
 * 관리자 권한 Supabase 클라이언트 생성
 * RLS를 우회하여 모든 데이터에 접근 가능
 * @returns Supabase Admin 클라이언트 인스턴스
 * @throws 클라이언트 사이드에서 호출 시 에러
 */
export function createAdminClient() {
  // 클라이언트 사이드에서 호출 방지
  if (!isServer()) {
    throw new Error('관리자 클라이언트는 서버 사이드에서만 사용할 수 있습니다.')
  }
  
  if (adminClient) return adminClient
  
  const env = getEnv()
  
  if (!env.supabase.serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다.')
  }
  
  adminClient = createClient<Database>(
    env.supabase.url,
    env.supabase.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          'x-application-name': 'gameplaza-admin',
        },
      },
    }
  )
  
  return adminClient
}

/**
 * 기존 관리자 클라이언트 인스턴스 가져오기
 * @returns 기존 Admin 클라이언트 인스턴스 또는 새로 생성
 */
export function getAdminClient() {
  return adminClient || createAdminClient()
}