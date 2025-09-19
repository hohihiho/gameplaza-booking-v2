// 내비게이션 컴포넌트
// 비전공자 설명: 모든 페이지 상단에 표시되는 메뉴바입니다
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from './BetterAuthProvider';
import { signOut } from '@/lib/auth-client';
// ThemeToggle 제거 - 단순성 최우선
import { Menu, X, Home, Calendar, FileText, User, LogOut, CalendarDays, Gamepad2, ShieldCheck, HelpCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminCheck } from '@/app/hooks/useAdminCheck';

export default function Navigation() {
  const pathname = usePathname();
  
  // 네비게이션 활성화 - 홈페이지 버튼들이 정상 작동하도록 복원
  // return null;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();
  const { isAdmin } = useAdminCheck();
  
  const user = session?.user;
  
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
      {/* 모바일 전용 네비게이션 - 데스크톱은 제거 (단순성 최우선) */}
      {/* 모바일 네비게이션 */}
      <nav 
        className="md:hidden sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800"
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