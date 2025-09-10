"use client"

import { createAuthClient } from "better-auth/react"

// 관리자 이메일 목록 (클라이언트용)
const ADMIN_EMAILS = [
  'ndz5496@gmail.com',
  'admin@gameplaza.kr',
]

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
})

// 편의를 위한 인증 관련 훅과 함수들
export const { 
  signIn, 
  signOut, 
  signUp, 
  useSession,
  $Infer
} = authClient

// 관리자 권한 확인을 위한 커스텀 훅
export function useIsAdmin() {
  const session = useSession()
  
  if (!session.data?.user?.email) {
    return false
  }
  
  return ADMIN_EMAILS.includes(session.data.user.email.toLowerCase())
}

// useAuth 훅 추가 (호환성을 위해)
export function useAuth() {
  const { data: session, isPending: isLoading, error } = useSession()
  
  return {
    user: session?.user || null,
    session,
    isLoading,
    isAuthenticated: !!session?.user,
    error
  }
}

// 세션 타입
export type Session = typeof $Infer.Session
export type User = typeof $Infer.User