'use client'

import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      refetchInterval={0} // 자동 새로고침 비활성화
      refetchOnWindowFocus={false} // 윈도우 포커스시 새로고침 비활성화
    >
      {children}
    </SessionProvider>
  )
}