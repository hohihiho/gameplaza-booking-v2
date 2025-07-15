// 예약 레이아웃
// 비전공자 설명: 예약 페이지들의 공통 레이아웃입니다
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar,
  BarChart3,
  ChevronLeft
} from 'lucide-react';

export default function ReservationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const reservationPages = [
    { href: '/reservations', label: '내역', icon: Calendar },
    { href: '/reservations/stats', label: '통계', icon: BarChart3 },
  ];

  // 현재 페이지가 예약 페이지인지 확인
  const isReservationPage = pathname.startsWith('/reservations') && pathname !== '/reservations/new' && pathname !== '/reservations/complete';

  if (!isReservationPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* 상단 고정 헤더 */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto">
          {/* 페이지 타이틀 */}
          <div className="px-5 py-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">내 예약</h1>
                <p className="text-base text-gray-600 dark:text-gray-400 mt-1">예약 현황을 확인하고 관리하세요</p>
              </div>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="px-5 pb-2">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
              <div className="px-6">
                <nav className="flex space-x-1 -mb-px overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  {reservationPages.map((page) => {
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
          </div>
        </div>
      </header>

      {/* 페이지 콘텐츠 */}
      <div className="max-w-4xl mx-auto px-5 py-6">
        {children}
      </div>
    </div>
  );
}