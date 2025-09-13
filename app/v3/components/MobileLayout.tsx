'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface MobileLayoutProps {
  children: React.ReactNode
  title?: string
  showBack?: boolean
  onBack?: () => void
}

export default function MobileLayout({ 
  children, 
  title = '예약 관리',
  showBack = false,
  onBack
}: MobileLayoutProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  useEffect(() => {
    checkAuth()
  }, [])
  
  const checkAuth = async () => {
    try {
      // Better Auth 세션 체크
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      if (data?.user) {
        setUser(data.user)
      } else {
        // 로그인 페이지로 리다이렉트 (V3로 돌아오도록 redirect 파라미터 설정)
        const currentPath = window.location.pathname
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      // 에러 발생 시에도 로그인 페이지로 리다이렉트
      const currentPath = window.location.pathname
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`)
    } finally {
      setLoading(false)
    }
  }
  
  const handleLogout = async () => {
    try {
      // Better Auth 로그아웃 처리
      // 로그아웃 후 로그인 페이지로 리다이렉트
      window.location.href = `/api/auth/signout?callbackUrl=${encodeURIComponent('/login')}`
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 모바일 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b lg:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            {showBack && (
              <button
                onClick={onBack}
                className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-2">
                {user.image && (
                  <img 
                    src={user.image} 
                    alt={user.name || ''}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span className="text-sm text-gray-600">
                  {user.name || user.email}
                </span>
              </div>
            )}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* 모바일 메뉴 드롭다운 */}
        {showMobileMenu && (
          <div className="absolute top-14 left-0 right-0 bg-white border-b shadow-lg">
            <nav className="py-2">
              <a href="/v3/reservations" className="block px-4 py-3 hover:bg-gray-50">
                예약 목록
              </a>
              <a href="/v3/reservations/new" className="block px-4 py-3 hover:bg-gray-50">
                새 예약
              </a>
              <a href="/v3/devices" className="block px-4 py-3 hover:bg-gray-50">
                기기 관리
              </a>
              <a href="/v3/stats" className="block px-4 py-3 hover:bg-gray-50">
                통계
              </a>
              <div className="border-t">
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-3 hover:bg-gray-50 text-red-600"
                >
                  로그아웃
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* 데스크톱 헤더 */}
      <header className="hidden lg:block bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-semibold">V3 예약 시스템</h1>
              <nav className="flex gap-6">
                <a href="/v3/reservations" className="text-gray-600 hover:text-gray-900">
                  예약 목록
                </a>
                <a href="/v3/reservations/new" className="text-gray-600 hover:text-gray-900">
                  새 예약
                </a>
                <a href="/v3/devices" className="text-gray-600 hover:text-gray-900">
                  기기 관리
                </a>
                <a href="/v3/stats" className="text-gray-600 hover:text-gray-900">
                  통계
                </a>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <>
                  <div className="flex items-center gap-2">
                    {user.image && (
                      <img 
                        src={user.image} 
                        alt={user.name || ''}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span className="text-sm text-gray-600">
                      {user.name || user.email}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    로그아웃
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
          {children}
        </div>
      </main>

      {/* 모바일 하단 네비게이션 */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="grid grid-cols-4 h-16">
          <a href="/v3/reservations" className="flex flex-col items-center justify-center gap-1 text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs">예약</span>
          </a>
          
          <a href="/v3/reservations/new" className="flex flex-col items-center justify-center gap-1 text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs">새 예약</span>
          </a>
          
          <a href="/v3/devices" className="flex flex-col items-center justify-center gap-1 text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <span className="text-xs">기기</span>
          </a>
          
          <a href="/v3/stats" className="flex flex-col items-center justify-center gap-1 text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs">통계</span>
          </a>
        </div>
      </nav>
    </div>
  )
}