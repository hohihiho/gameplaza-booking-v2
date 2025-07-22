'use client'

import { useEffect } from 'react'
import { initErrorTracking, setupGlobalErrorHandlers, setErrorUser } from '@/lib/monitoring/error-tracking'
import { useAuth } from '@/lib/hooks/useAuth'

export function ErrorTrackingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  useEffect(() => {
    // 에러 추적 초기화
    initErrorTracking()
    
    // 전역 에러 핸들러 설정
    setupGlobalErrorHandlers()
  }, [])

  useEffect(() => {
    // 사용자 정보 설정
    if (user) {
      setErrorUser({
        id: user.id,
        username: user.phone || user.email || undefined,
      })
    }
  }, [user])

  return <>{children}</>
}