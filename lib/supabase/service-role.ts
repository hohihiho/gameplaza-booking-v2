import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// 주의: 이 클라이언트는 서버 사이드에서만 사용해야 합니다!
// Service Role 키는 모든 RLS 정책을 우회합니다.
export function createServiceRoleClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}