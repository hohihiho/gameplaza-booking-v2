// 내비게이션 컴포넌트
// 비전공자 설명: 모든 페이지 상단에 표시되는 메뉴바입니다
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useUser, UserButton } from '@stackframe/stack';
import { ThemeToggle } from './ThemeToggle';
import { Menu, X, Home, Calendar, FileText, User, LogOut, CalendarDays, Gamepad2, ShieldCheck, HelpCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminCheck } from '@/app/hooks/useAdminCheck';
import { stackApp } from '@/stack-client';

export default function Navigation() {
  const pathname = usePathname();
  
  // 네비게이션 활성화 - 홈페이지 버튼들이 정상 작동하도록 복원
  // return null;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();
  const stackUser = useUser(); // Stack Auth 사용자
  const { isAdmin } = useAdminCheck();
  
  const user = stackUser || session?.user; // Stack Auth 우선 사용
  
  // 관리자 권한에 따라 메뉴 표시
  const showAdminMenu = isAdmin;
  

  // 세션 변경 감지 및 강제 새로고침
  useEffect(() => {
    // URL에 로그인 완료 파라미터가 있으면 페이지 새로고침
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('login') === 'success') {
      window.location.href = window.location.pathname;
    }
  }, []);
  
  // 프로필 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };
  
  // 네비게이션 아이템 - 로그인 상태에 따라 다르게 표시
  const navItems = user ? [
    { href: '/', label: '홈', icon: Home },
    { href: '/reservations/new', label: '예약하기', icon: Calendar },
    { href: '/reservations', label: '내 예약', icon: FileText },
    { href: '/machines', label: '기기 현황', icon: Gamepad2 },
    { href: '/schedule', label: '운영 일정', icon: CalendarDays },
    { href: '/guide', label: '이용안내', icon: HelpCircle },
    { href: '/mypage', label: '마이페이지', icon: User },
    ...(showAdminMenu ? [{ href: '/admin', label: '관리자 페이지', icon: ShieldCheck }] : [])
  ] : [
    { href: '/', label: '홈', icon: Home },
    { href: '/machines', label: '기기 현황', icon: Gamepad2 },
    { href: '/schedule', label: '운영 일정', icon: CalendarDays },
    { href: '/guide', label: '이용안내', icon: HelpCircle },
  ];

  return (
    <>
      {/* 데스크톱 네비게이션 */}
      <nav 
        className="hidden md:block sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800"
        role="navigation"
        aria-label="주 네비게이션"
      >
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link 
                href="/" 
                className="text-xl font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md px-2 py-1"
                aria-label="게임플라자 홈페이지로 이동"
              >
                게임플라자
              </Link>
              <ul className="flex items-center gap-1" role="menubar">
                {navItems.map((item) => (
                  <li key={item.href} role="none">
                    <Link
                      href={item.href}
                      role="menuitem"
                      aria-current={pathname === item.href ? 'page' : undefined}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        pathname === item.href
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="sr-only">{item.label} 페이지로 이동</span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              {status === 'loading' ? (
                <div 
                  className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"
                  role="status"
                  aria-label="로그인 상태 확인 중"
                />
              ) : user ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    aria-expanded={isProfileOpen}
                    aria-haspopup="menu"
                    aria-label={`${user?.name || '사용자'} 프로필 메뉴 ${isProfileOpen ? '닫기' : '열기'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      {user?.image ? (
                        <Image
                          src={user?.image || ''}
                          alt=""
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-medium dark:text-white">
                          {user?.name?.[0] || 'U'}
                        </div>
                      )}
                    </div>
                  </button>
                  
                  {/* 프로필 드롭다운 */}
                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 py-2 z-50"
                        role="menu"
                        aria-label="사용자 메뉴"
                        aria-orientation="vertical"
                      >
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            {user?.image ? (
                              <Image
                                src={user?.image || ''}
                                alt={user?.name || '프로필'}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-lg font-medium dark:text-white">
                                {user?.name?.[0] || 'U'}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium dark:text-white">{user?.name || '사용자'}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      <Link
                        href="/mypage"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800"
                        role="menuitem"
                        aria-label="마이페이지로 이동"
                      >
                        <User className="w-4 h-4" aria-hidden="true" />
                        마이페이지
                      </Link>
                      
                      {showAdminMenu && (
                        <Link
                          href="/admin"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800"
                          role="menuitem"
                          aria-label="관리자 페이지로 이동"
                        >
                          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                          관리자 페이지
                        </Link>
                      )}
                      
                      <div className="border-t border-gray-200 dark:border-gray-800 mt-2 pt-2">
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsProfileOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800"
                          role="menuitem"
                          aria-label="로그아웃"
                        >
                          <LogOut className="w-4 h-4" aria-hidden="true" />
                          로그아웃
                        </button>
                      </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  aria-label="로그인 페이지로 이동"
                >
                  로그인
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 모바일 네비게이션 */}
      <nav 
        className="md:hidden sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 dynamic-island-compatible"
        role="navigation"
        aria-label="모바일 네비게이션"
      >
        <div className="px-5">
          <div className="flex items-center justify-between h-16">
            <Link 
              href="/" 
              className="text-xl font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md px-2 py-1"
              aria-label="게임플라자 홈페이지로 이동"
            >
              게임플라자
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-target min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-navigation-menu"
                data-testid="mobile-menu-toggle"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5 text-gray-700 dark:text-gray-300" aria-hidden="true" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMenuOpen && (
          <div 
            id="mobile-navigation-menu"
            className="absolute top-16 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-lg"
            role="menu"
            aria-labelledby="mobile-menu-button"
          >
            <nav className="px-5 py-4" role="navigation" aria-label="모바일 주 메뉴">
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors touch-target min-h-[48px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                          pathname === item.href
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        role="menuitem"
                        aria-current={pathname === item.href ? 'page' : undefined}
                        aria-label={`${item.label} 페이지로 이동`}
                      >
                        <Icon className="w-5 h-5" aria-hidden="true" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              
              <div className="border-t border-gray-200 dark:border-gray-800 mt-2 pt-2">
                {status === 'loading' ? (
                  <div className="px-4 py-3">
                    <div 
                      className="w-full h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"
                      role="status"
                      aria-label="로그인 상태 확인 중"
                    />
                  </div>
                ) : user ? (
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    role="menuitem"
                    aria-label="로그아웃"
                  >
                    <LogOut className="w-5 h-5" aria-hidden="true" />
                    <span className="font-medium">로그아웃</span>
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-3 text-center bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    data-testid="mobile-login-button"
                    aria-label="로그인 페이지로 이동"
                  >
                    로그인
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </nav>
    </>
  );
}