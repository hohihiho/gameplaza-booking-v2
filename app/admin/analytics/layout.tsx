// 통계 분석 레이아웃
// 비전공자 설명: 통계 분석 페이지들의 공통 레이아웃입니다
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar,
  DollarSign,
  Users,
  ChevronLeft,
  Gamepad2
} from 'lucide-react';

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const analyticsPages = [
    { href: '/admin/analytics/reservations', label: '예약 통계', icon: Calendar },
    { href: '/admin/analytics/revenue', label: '매출 분석', icon: DollarSign },
    { href: '/admin/analytics/customers', label: '고객 분석', icon: Users },
    { href: '/admin/analytics/devices', label: '기종 분석', icon: Gamepad2 },
  ];

  // 현재 페이지가 통계 분석 페이지인지 확인
  const isAnalyticsPage = pathname.startsWith('/admin/analytics');

  if (!isAnalyticsPage) {
    return <>{children}</>;
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          통계 분석
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          데이터를 분석하여 비즈니스 인사이트를 제공합니다
        </p>
      </div>

      {/* 탭 네비게이션 - 드래그 가능 */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm mb-6">
        <div className="px-6">
          <nav className="flex space-x-1 -mb-px overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {analyticsPages.map((page) => {
              const Icon = page.icon;
              const isActive = pathname === page.href;
              
              return (
                <Link
                  key={page.href}
                  href={page.href}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap hover:scale-105 ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {page.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 페이지 콘텐츠 */}
      <div>
        {children}
      </div>
    </div>
  );
}