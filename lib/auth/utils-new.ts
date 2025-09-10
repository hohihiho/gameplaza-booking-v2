import { createClient } from '@/lib/supabase'

/**
 * 사용자가 인증되었는지 확인합니다.
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getSession()
    
    if (error || !data?.session) {
      return false
    }
    
    return true
  } catch (error) {
    console.error('Auth check error:', error)
    return false
  }
}

/**
 * 사용자가 관리자 권한을 가지고 있는지 확인합니다.
 */
export async function hasAdminAccess(userId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('admins')
      .select('id, is_super_admin')
      .eq('user_id', userId)
      .single()
    
    if (error || !data) {
      return false
    }
    
    return true
  } catch (error) {
    console.error('Admin check error:', error)
    return false
  }
}

/**
 * 현재 세션의 사용자 정보를 가져옵니다.
 */
export async function getSessionUser() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getSession()
    
    if (error || !data?.session?.user) {
      return null
    }
    
    return data.session.user
  } catch (error) {
    console.error('Get user error:', error)
    return null
  }
}

