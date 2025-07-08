'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Gamepad2, Clock, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BottomTabBar() {
  const pathname = usePathname();

  const tabs = [
    { href: '/', icon: Home, label: '홈' },
    { href: '/reservations/new', icon: Calendar, label: '예약' },
    { href: '/machines', icon: Gamepad2, label: '기기' },
    { href: '/schedule', icon: Clock, label: '일정' },
    { href: '/mypage', icon: User, label: 'MY' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* 배경 블러 효과 */}
      <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-800/50" />
      
      {/* 탭 아이템들 */}
      <div className="relative grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));
          const Icon = tab.icon;
          
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex flex-col items-center justify-center py-2"
            >
              {/* 활성 상태 인디케이터 */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full"
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30
                  }}
                />
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
              
              {/* 예약 탭 특별 표시 */}
              {tab.label === '예약' && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-coral-500 rounded-full animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}