/**
 * Supabase 서비스 롤 클라이언트
 * RLS를 우회하여 관리자 권한으로 데이터베이스에 접근하는 클라이언트입니다.
 * 
 * @module lib/supabase/service-role
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getEnv } from '@/lib/config/env'
import type { Database } from './types'

/**
 * 서비스 롤 Supabase 클라이언트 생성
 * 
 * Row Level Security(RLS)를 우회하여 모든 데이터에 접근할 수 있는
 * 서비스 롤 권한의 Supabase 클라이언트를 생성합니다.
 * 
 * @returns {SupabaseClient<Database>} Supabase 클라이언트 인스턴스
 * @throws {Error} 필수 환경변수가 설정되지 않은 경우
 * 
 * @example
 * ```typescript
 * try {
 *   const supabase = createServiceRoleClient()
 *   const { data, error } = await supabase.from('users').select()
 * } catch (error) {
 *   console.error('Failed to create Supabase client:', error)
 * }
 * ```
 */
export function createServiceRoleClient(): SupabaseClient<Database> {
  const env = getEnv()
  
  // 환경변수 검증
  if (!env.supabase.url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }
  
  if (!env.supabase.serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  
  // 서비스 롤 클라이언트 생성
  const supabase = createClient<Database>(
    env.supabase.url,
    env.supabase.serviceRoleKey,
    {
      auth: {
        // 서비스 롤 키는 토큰 갱신이 필요 없음
        autoRefreshToken: false,
        // 세션 유지 불필요
        persistSession: false,
        // OAuth 리다이렉트 감지 비활성화
        detectSessionInUrl: false
      },
      global: {
        headers: {
          // 애플리케이션 식별자 추가
          'x-application-name': 'gameplaza-service-role',
          // API 버전 명시
          'x-api-version': 'v2'
        }
      },
      // 실시간 기능 비활성화 (서비스 롤에서는 불필요)
      realtime: {
        enabled: false
      }
    }
  )
  
  return supabase
}

/**
 * Supabase 에러 처리 헬퍼
 * 
 * Supabase 작업 중 발생한 에러를 일관된 형식으로 처리합니다.
 * 
 * @param {unknown} error - 처리할 에러 객체
 * @param {string} [context] - 에러 발생 컨텍스트 (선택사항)
 * @returns {object} 표준화된 에러 응답 객체
 * 
 * @example
 * ```typescript
 * try {
 *   const supabase = createServiceRoleClient()
 *   const { data, error } = await supabase.from('users').select()
 *   if (error) throw error
 * } catch (error) {
 *   return NextResponse.json(
 *     handleSupabaseError(error, 'Failed to fetch users'),
 *     { status: 500 }
 *   )
 * }
 * ```
 */
export function handleSupabaseError(error: unknown, context?: string) {
  // 콘솔에 에러 로깅
  console.error(`[Supabase Error]${context ? ` ${context}:` : ''}`, error)
  
  // 에러 타입별 처리
  if (error instanceof Error) {
    // 환경변수 관련 에러
    if (error.message.includes('SUPABASE_SERVICE_ROLE_KEY') || 
        error.message.includes('NEXT_PUBLIC_SUPABASE_URL')) {
      return {
        error: 'Configuration Error',
        message: 'Server configuration is incomplete. Please contact support.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    }
    
    // 데이터베이스 연결 에러
    if (error.message.includes('connection') || 
        error.message.includes('timeout')) {
      return {
        error: 'Database Connection Error',
        message: 'Unable to connect to the database. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    }
    
    // 권한 관련 에러
    if (error.message.includes('permission') || 
        error.message.includes('denied')) {
      return {
        error: 'Permission Denied',
        message: 'You do not have permission to perform this action.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    }
    
    // 기타 에러
    return {
      error: 'Database Operation Failed',
      message: context || 'An error occurred while processing your request.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
  }
  
  // 알 수 없는 에러 타입
  return {
    error: 'Unknown Error',
    message: 'An unexpected error occurred. Please try again.',
    details: process.env.NODE_ENV === 'development' ? String(error) : undefined
  }
}

/**
 * 서비스 롤 클라이언트 싱글톤 (선택사항)
 * 
 * 동일한 요청 내에서 여러 번 클라이언트를 생성하는 것을 방지하기 위한
 * 싱글톤 패턴 구현입니다. Edge Runtime에서는 사용하지 마세요.
 */
let serviceRoleClient: SupabaseClient<Database> | null = null

/**
 * 싱글톤 서비스 롤 클라이언트 가져오기
 * 
 * @returns {SupabaseClient<Database>} Supabase 클라이언트 인스턴스
 * @deprecated Edge Runtime에서는 사용하지 마세요. createServiceRoleClient()를 직접 사용하세요.
 */
export function getServiceRoleClient(): SupabaseClient<Database> {
  if (!serviceRoleClient) {
    serviceRoleClient = createServiceRoleClient()
  }
  return serviceRoleClient
}