'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Gamepad2, Clock, User, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import ReservationBottomSheet from './ReservationBottomSheet';

export default function BottomTabBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [isReservationSheetOpen, setIsReservationSheetOpen] = useState(false);

  // 로그인 상태에 따라 다른 탭 구성 - 예약 탭을 중앙에 배치
  const tabs = isLoggedIn ? [
    { href: '/', icon: Home, label: '홈' },
    { href: '/machines', icon: Gamepad2, label: '기기' },
    { id: 'reservation', icon: Calendar, label: '예약', isSpecial: true },
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
      
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* 배경 블러 효과 - 더 강한 대비 */}
      <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700" />
      
      {/* 탭 아이템들 */}
      <div className={`relative grid ${isLoggedIn ? 'grid-cols-5' : 'grid-cols-4'} h-16`}>
        {tabs.map((tab) => {
          // 예약 관련 페이지들을 정확히 구분
          let isActive = false;
          if (tab.href === '/') {
            isActive = pathname === '/';
          } else if (tab.href === '/mypage') {
            // 마이페이지는 /mypage로 시작하는 모든 경로에서 활성화
            isActive = pathname.startsWith('/mypage');
          } else if (tab.href) {
            // 나머지는 정확히 일치하거나 하위 경로일 때 활성화
            isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          }
          
          const Icon = tab.icon;
          
          // 특별한 예약 탭 처리
          if ('isSpecial' in tab && tab.isSpecial) {
            return (
              <button
                key={tab.id}
                onClick={() => setIsReservationSheetOpen(true)}
                className="relative flex flex-col items-center justify-center py-2"
                id="reservation-tab-button"
              >
                {/* 특별한 예약 버튼 디자인 - 크기 축소 */}
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative">
                    {/* 배경 그라데이션 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full blur-sm opacity-50" />
                    <div className="relative w-10 h-10 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </motion.div>
              </button>
            );
          }
          
          return (
            <Link
              key={tab.href}
              href={tab.href || '/'}
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
                      : 'text-gray-700 dark:text-gray-300'
                  }`} 
                />
                <span 
                  className={`text-xs font-medium transition-colors duration-200 ${
                    isActive 
                      ? 'text-indigo-600 dark:text-indigo-400' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {tab.label}
                </span>
              </motion.div>
              
              {/* featured 탭 특별 표시 - 그라데이션 배경 효과 */}
              {'featured' in tab && tab.featured && !isActive && (
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent rounded-lg" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
    
    {/* 예약 Bottom Sheet */}
    <ReservationBottomSheet 
      isOpen={isReservationSheetOpen}
      onClose={() => setIsReservationSheetOpen(false)}
    />
    </>
  );
}