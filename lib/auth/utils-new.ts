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

/**
 * 전화번호 유효성을 검사합니다.
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return false
  
  // 하이픈 제거
  const cleaned = phone.replace(/-/g, '')
  
  // 한국 휴대폰 번호 패턴 (010, 011, 016, 017, 018, 019)
  const phoneRegex = /^01[0-9]{8,9}$/
  
  return phoneRegex.test(cleaned)
}

/**
 * 전화번호를 포맷팅합니다.
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return ''
  
  // 하이픈 제거
  const cleaned = phone.replace(/-/g, '')
  
  // 10자리 또는 11자리가 아니면 그대로 반환
  if (cleaned.length !== 10 && cleaned.length !== 11) {
    return phone
  }
  
  // 3-3-4 또는 3-4-4 형식으로 포맷팅
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  } else {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  }
}