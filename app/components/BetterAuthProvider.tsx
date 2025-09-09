'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name?: string
  image?: string
  role?: string
}

interface Session {
  user: User | null
  expires?: string
}

interface AuthContextType {
  data: Session | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  update: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  data: null,
  status: 'loading',
  update: async () => {}
})

export function useSession() {
  return useContext(AuthContext)
}

export async function signOut() {
  try {
    await fetch('/api/auth/signout', { method: 'POST' })
    window.location.href = '/'
  } catch (error) {
    console.error('Sign out error:', error)
  }
}

interface BetterAuthProviderProps {
  children: ReactNode
}

export function BetterAuthProvider({ children }: BetterAuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')
  const pathname = usePathname()
  
  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session')
      if (res.ok) {
        const data = await res.json()
        if (data?.user) {
          setSession(data)
          setStatus('authenticated')
        } else {
          setSession(null)
          setStatus('unauthenticated')
        }
      } else {
        setSession(null)
        setStatus('unauthenticated')
      }
    } catch (error) {
      console.error('Session fetch error:', error)
      setSession(null)
      setStatus('unauthenticated')
    }
  }
  
  useEffect(() => {
    fetchSession()
  }, [pathname])
  
  const value: AuthContextType = {
    data: session,
    status,
    update: fetchSession
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}