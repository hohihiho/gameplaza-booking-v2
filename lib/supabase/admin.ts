import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Admin 클라이언트 - RLS 우회
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service key로 RLS 우회
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}