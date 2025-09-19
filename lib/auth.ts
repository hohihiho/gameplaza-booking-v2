// Better Auth 역할 기반 권한 검사 유틸리티
import { auth } from '@/lib/auth/server'
import { headers } from 'next/headers'

/**
 * Better Auth 역할 시스템을 사용한 관리자 권한 확인
 * @param userRole - 사용자의 역할 (Better Auth에서 가져온 user.role)
 * @returns 관리자 권한이 있는지 여부
 */
export function isAdmin(userRole?: string): boolean {
  if (!userRole) return false
  return ['admin', 'super_admin'].includes(userRole)
}

/**
 * 슈퍼 관리자 권한 확인
 * @param userRole - 사용자의 역할
 * @returns 슈퍼 관리자 권한이 있는지 여부
 */
export function isSuperAdmin(userRole?: string): boolean {
  if (!userRole) return false
  return userRole === 'super_admin'
}

/**
 * VIP 멤버 권한 확인
 * @param userRole - 사용자의 역할
 * @returns VIP 멤버 권한이 있는지 여부
 */
export function isVipMember(userRole?: string): boolean {
  if (!userRole) return false
  return ['vip_member', 'gold_member', 'silver_member'].includes(userRole)
}

/**
 * 서버에서 현재 사용자의 세션 정보 가져오기
 * @returns 현재 사용자 세션 또는 null
 */
export async function getCurrentUser() {
  try {
    const session = await auth.api.getSession({
      headers: headers()
    })
    return session?.user || null
  } catch (error) {
    console.error('getCurrentUser 오류:', error)
    return null
  }
}

/**
 * 서버에서 현재 사용자가 관리자인지 확인
 * @returns 관리자 권한 여부
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return isAdmin(user?.role)
}

/**
 * 서버에서 현재 사용자가 슈퍼 관리자인지 확인
 * @returns 슈퍼 관리자 권한 여부
 */
export async function isCurrentUserSuperAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return isSuperAdmin(user?.role)
}