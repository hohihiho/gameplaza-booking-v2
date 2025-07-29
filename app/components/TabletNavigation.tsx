'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  Menu, X, Home, Calendar, FileText, Gamepad2, Clock, 
  User, LogOut, Shield, HelpCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TabletNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin === true;

  const navItems = [
    { href: '/', label: '홈', icon: Home },
    { href: '/reservations/new', label: '예약하기', icon: Calendar, requireAuth: true },
    { href: '/reservations', label: '내 예약', icon: FileText, requireAuth: true },
    { href: '/machines', label: '기기 현황', icon: Gamepad2 },
    { href: '/schedule', label: '운영 일정', icon: Clock },
  ];

  const bottomItems = [
    { href: '/mypage', label: '마이페이지', icon: User, requireAuth: true },
    ...(isAdmin ? [{ href: '/admin', label: '관리자', icon: Shield }] : []),
    { href: '/guide', label: '이용 안내', icon: HelpCircle },
  ];

  const handleNavClick = () => {
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
    setIsOpen(false);
  };

  return (
    <>
      {/* 햄버거 메뉴 버튼 - 태블릿에서만 표시 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden md:flex lg:hidden fixed top-4 left-4 z-50 items-center justify-center w-12 h-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
        aria-label="메뉴 열기"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-gray-700 dark:text-gray-200" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
        )}
      </button>

      {/* 오버레이 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden md:block lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* 슬라이드 메뉴 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="hidden md:block lg:hidden fixed left-0 top-0 h-full w-72 bg-white dark:bg-gray-900 shadow-xl z-50"
          >
            <div className="flex flex-col h-full">
              {/* 로고 영역 */}
              <div className="p-6 pt-20">
                <Link href="/" onClick={handleNavClick}>
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider">GWANGJU</span>
                    <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent tracking-wide">
                      GAMEPLAZA
                    </h1>
                  </div>
                </Link>
              </div>

              {/* 메인 네비게이션 */}
              <nav className="flex-1 px-4 pb-4">
                <ul className="space-y-1">
                  {navItems.map((item) => {
                    if (item.requireAuth && !session) return null;
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={handleNavClick}
                          className={`
                            flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                            ${isActive 
                              ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }
                          `}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                {/* 구분선 */}
                <div className="my-4 border-t border-gray-200 dark:border-gray-700" />

                {/* 하단 메뉴 */}
                <ul className="space-y-1">
                  {bottomItems.map((item) => {
                    if (item.requireAuth && !session) return null;
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={handleNavClick}
                          className={`
                            flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                            ${isActive 
                              ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }
                          `}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* 로그인/로그아웃 영역 */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                {session ? (
                  <div className="space-y-3">
                    <div className="px-4 py-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">환영합니다</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{session.user.name}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">로그아웃</span>
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={handleNavClick}
                    className="flex items-center justify-center w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    로그인
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}