'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
// Better Auth imports
import { useSession, signOut } from '@/lib/hooks/useAuth';
import { 
  Home, Calendar, FileText, Gamepad2, Clock, User, LogOut, 
  ChevronRight, Sparkles, Shield, HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeToggleWithMenu } from './ThemeToggleWithMenu';

export default function DesktopSidebar() {
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

  return (
    <div className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-r border-gray-200/50 dark:border-gray-800/50 z-40">
      <div className="flex flex-col h-full">
        {/* 로고 영역 */}
        <div className="p-6">
          <Link href="/" className="block">
            <div className="relative group">
              {/* 로고 텍스트 */}
              <div className="flex flex-col items-start">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider">GWANGJU</span>
                <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent font-orbitron tracking-wide leading-tight">
                  GAMEPLAZA
                </h1>
                
                {/* 액센트 라인 */}
                <div className="flex items-center gap-1 mt-3">
                  <div className="h-[2px] w-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full group-hover:w-8 transition-all duration-300" />
                  <div className="h-[2px] w-2 bg-purple-500 rounded-full group-hover:w-4 transition-all duration-300 delay-75" />
                  <div className="h-[2px] w-1 bg-pink-500 rounded-full group-hover:w-2 transition-all duration-300 delay-150" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* 메인 네비게이션 */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              if (item.requireAuth && !session) return null;
              
              const isActive = pathname === item.href;
              
              return (
                <motion.div
                  key={item.href}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                      ${isActive 
                        ? 'bg-indigo-600 dark:bg-indigo-600 text-white shadow-lg' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                    {item.label === '예약하기' && (
                      <Sparkles className="w-4 h-4 ml-auto text-yellow-400" />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* 구분선 */}
          <div className="my-4 border-t border-gray-200/50 dark:border-gray-800/50" />

          {/* 하단 메뉴 */}
          <div className="space-y-1">
            {bottomItems.map((item) => {
              if (item.requireAuth && !session) return null;
              
              const isActive = pathname === item.href;
              
              return (
                <motion.div
                  key={item.href}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                      ${isActive 
                        ? 'bg-indigo-600 dark:bg-indigo-600 text-white shadow-lg' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </nav>

        {/* 유저 정보 및 설정 */}
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-800/50">
          {session ? (
            <div className="space-y-3">
              {/* 유저 정보 */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                <div className="flex items-center gap-3 mb-3">
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || '프로필'}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                      {session.user?.name?.[0] || 'U'}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {session.user?.nickname || session.user?.name || '사용자'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {session.user?.email}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  로그아웃
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="block w-full text-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              로그인
            </Link>
          )}
          
          {/* 테마 토글 */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">테마</span>
            <ThemeToggleWithMenu variant="solid" />
          </div>
        </div>
      </div>
    </div>
  );
}