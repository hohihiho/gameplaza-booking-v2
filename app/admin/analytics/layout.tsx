// 통계 분석 레이아웃
// 비전공자 설명: 통계 분석 페이지들의 공통 레이아웃입니다
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar,
  DollarSign,
  Users
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
  ];

  // 현재 페이지가 통계 분석 페이지인지 확인
  const isAnalyticsPage = pathname.startsWith('/admin/analytics');

  if (!isAnalyticsPage) {
    return <>{children}</>;
  }

  return (
    <div>
      {/* 탭 네비게이션 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6">
          <nav className="flex space-x-1 -mb-px">
            {analyticsPages.map((page) => {
              const Icon = page.icon;
              const isActive = pathname === page.href;
              
              return (
                <Link
                  key={page.href}
                  href={page.href}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
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
      {children}
    </div>
  );
}