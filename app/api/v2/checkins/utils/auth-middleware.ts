import { NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/src/infrastructure/middleware/auth.middleware'
import { createApiError } from './error-handler'

export interface AuthUser {
  id: string
  email: string
  role: string
}

/**
 * 인증 확인 미들웨어
 */
export function requireAuth(request: NextRequest): AuthUser | ReturnType<typeof createApiError> {
  const user = getAuthenticatedUser(request)
  
  if (!user) {
    return createApiError(401, '인증이 필요합니다')
  }
  
  return user
}

/**
 * 관리자 권한 확인 미들웨어
 */
export function requireAdmin(request: NextRequest): AuthUser | ReturnType<typeof createApiError> {
  const authResult = requireAuth(request)
  
  // 에러 응답인 경우 그대로 반환
  if (!authResult || 'error' in authResult) {
    return authResult
  }
  
  // 타입 가드로 AuthUser 타입 확인
  const user = authResult as AuthUser
  if (user.role !== 'admin') {
    return createApiError(403, '관리자 권한이 필요합니다')
  }
  
  return user
}

/**
 * 특정 권한 확인 미들웨어
 */
export function requireRole(
  request: NextRequest, 
  allowedRoles: string[]
): AuthUser | ReturnType<typeof createApiError> {
  const authResult = requireAuth(request)
  
  // 에러 응답인 경우 그대로 반환
  if (!authResult || 'error' in authResult) {
    return authResult
  }
  
  // 타입 가드로 AuthUser 타입 확인
  const user = authResult as AuthUser
  if (!allowedRoles.includes(user.role)) {
    return createApiError(
      403, 
      `다음 권한 중 하나가 필요합니다: ${allowedRoles.join(', ')}`
    )
  }
  
  return user
}

/**
 * 본인 확인 미들웨어
 * 요청한 리소스의 소유자인지 확인
 */
export function requireOwnership(
  request: NextRequest,
  resourceOwnerId: string
): AuthUser | ReturnType<typeof createApiError> {
  const authResult = requireAuth(request)
  
  // 에러 응답인 경우 그대로 반환
  if (!authResult || 'error' in authResult) {
    return authResult
  }
  
  // 타입 가드로 AuthUser 타입 확인
  const user = authResult as AuthUser
  
  // 관리자는 모든 리소스에 접근 가능
  if (user.role === 'admin') {
    return user
  }
  
  // 일반 사용자는 본인 리소스만 접근 가능
  if (user.id !== resourceOwnerId) {
    return createApiError(403, '해당 리소스에 대한 접근 권한이 없습니다')
  }
  
  return user
}