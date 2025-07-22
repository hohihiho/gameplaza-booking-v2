/**
 * Supabase 클라이언트 통합 모듈
 * 모든 Supabase 관련 기능을 한 곳에서 관리합니다.
 */

// 클라이언트 exports
export { createClient, getClient } from './client'
// Server exports는 별도로 import해서 사용하세요: import { createClient } from '@/lib/supabase/server.server'
// export { createClient as createServerClient, createActionClient } from './server'
export { createAdminClient, getAdminClient } from './admin'

// 타입 exports - 명시적으로 export
export type { Database, Tables, TablesInsert, TablesUpdate, Enums, User, Reservation, Device, DeviceType, Admin } from './types'

// 헬퍼 함수들
// import { isServer } from '@/lib/config/env'

// getSupabaseClient 함수는 제거되었습니다.
// 대신 다음을 사용하세요:
// - Client Component: import { createClient } from '@/lib/supabase'
// - Server Component/API Route: import { createClient } from '@/lib/supabase/server.server'