'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Gamepad2, Clock, User, FileText, LogIn, CalendarPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';

export default function BottomTabBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  // 로그인 상태에 따라 다른 탭 구성 (예약하기는 FAB로 이동)
  const tabs = isLoggedIn ? [
    { href: '/', icon: Home, label: '홈' },
    { href: '/reservations', icon: FileText, label: '내예약' },
    { href: '/machines', icon: Gamepad2, label: '기기' },
    { href: '/schedule', icon: Clock, label: '일정' },
    { href: '/mypage', icon: User, label: 'MY' },
  ] : [
    { href: '/', icon: Home, label: '홈' },
    { href: '/machines', icon: Gamepad2, label: '기기' },
    { href: '/schedule', icon: Clock, label: '일정' },
    { href: '/login', icon: LogIn, label: '로그인', featured: true },
  ];

  return (
    <>
      {/* 플로팅 액션 버튼 - 로그인한 사용자에게만 표시 */}
      {isLoggedIn && (
        <Link
          href="/reservations/new"
          className="fixed bottom-20 right-4 z-50 md:hidden"
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20 
            }}
            className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center"
          >
            <CalendarPlus className="w-6 h-6 text-white" />
          </motion.div>
          {/* 반짝이는 효과 */}
          <motion.div
            className="absolute inset-0 w-14 h-14 bg-white rounded-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [0.8, 1.2, 1.2],
              opacity: [0, 0.3, 0] 
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1
            }}
          />
        </Link>
      )}
      
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* 배경 블러 효과 */}
      <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-800/50" />
      
      {/* 탭 아이템들 */}
      <div className={`relative grid ${isLoggedIn ? 'grid-cols-5' : 'grid-cols-4'} h-16`}>
        {tabs.map((tab) => {
          // 예약 관련 페이지들을 정확히 구분
          let isActive = false;
          if (tab.href === '/') {
            isActive = pathname === '/';
          } else if (tab.href === '/reservations') {
            // 내 예약 탭은 /reservations 페이지에서만 활성화
            isActive = pathname === '/reservations';
          } else if (tab.href === '/mypage') {
            // 마이페이지는 /mypage로 시작하는 모든 경로에서 활성화
            isActive = pathname.startsWith('/mypage');
          } else {
            // 나머지는 정확히 일치하거나 하위 경로일 때 활성화
            isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          }
          
          const Icon = tab.icon;
          
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex flex-col items-center justify-center py-2"
            >
              {/* 활성 상태 인디케이터 */}
              {isActive && (
                <div className="absolute top-0 inset-x-4 h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full" />
              )}
              
              {/* 아이콘과 라벨 */}
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center"
              >
                <Icon 
                  className={`w-5 h-5 mb-1 transition-colors duration-200 ${
                    isActive 
                      ? 'text-indigo-600 dark:text-indigo-400' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`} 
                />
                <span 
                  className={`text-xs font-medium transition-colors duration-200 ${
                    isActive 
                      ? 'text-indigo-600 dark:text-indigo-400' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {tab.label}
                </span>
              </motion.div>
              
              {/* featured 탭 특별 표시 - 그라데이션 배경 효과 */}
              {tab.featured && !isActive && (
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent rounded-lg" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
    </>
  );
}