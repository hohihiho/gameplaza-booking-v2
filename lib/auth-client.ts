import { createAuthClient } from "better-auth/react"
import { isAdmin } from "./auth"

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
  
  return isAdmin(session.data.user.email)
}

// 세션 타입
export type Session = typeof $Infer.Session
export type User = typeof $Infer.User