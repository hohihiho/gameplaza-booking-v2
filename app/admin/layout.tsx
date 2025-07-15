// 관리자 레이아웃
// 비전공자 설명: 관리자 페이지 전체를 감싸는 레이아웃입니다
'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  Gamepad2, 
  Clock, 
  Calendar, 
  Users, 
  Settings,
  Menu,
  X,
  ChevronLeft,
  FileText,
  CalendarDays,
  CheckSquare,
  BarChart3,
  Database,
  Download,
  UserCog,
  ShieldAlert
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 관리자 권한 확인
  useEffect(() => {
    const checkAdmin = async () => {
      if (status === 'loading') return;
      
      if (!session?.user) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('/api/admin/auth/check');
        const data = await response.json();
        
        if (!response.ok || !data.isAdmin) {
          router.push('/');
          return;
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Admin check error:', error);
        router.push('/');
      }
    };

    checkAdmin();
  }, [session, status, router]);

  const menuItems = [
    { href: '/admin', label: '대시보드', icon: LayoutDashboard },
    { href: '/admin/checkin', label: '체크인', icon: CheckSquare },
    { href: '/admin/devices', label: '기기 관리', icon: Gamepad2 },
    { href: '/admin/rental-devices', label: '대여기기관리', icon: Clock },
    { href: '/admin/reservations', label: '예약 관리', icon: Calendar },
    { href: '/admin/users', label: '회원 관리', icon: Users },
    { href: '/admin/admins', label: '관리자 관리', icon: UserCog },
    { href: '/admin/banned-words', label: '금지어 관리', icon: ShieldAlert },
    { href: '/admin/schedule', label: '운영 일정', icon: CalendarDays },
    { href: '/admin/analytics/reservations', label: '통계 분석', icon: BarChart3 },
    { href: '/admin/content', label: '콘텐츠 관리', icon: FileText },
    { href: '/admin/export', label: '데이터 내보내기', icon: Download },
    { href: '/admin/backup', label: '백업 관리', icon: Database },
    { href: '/admin/settings', label: '설정', icon: Settings },
  ];

  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* 모바일 헤더 */}
      <div className="lg:hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-lg font-semibold dark:text-white">관리자</h1>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
            사이트로 돌아가기
          </Link>
        </div>
      </div>

      <div className="flex">
        {/* 사이드바 */}
        <aside className={`
          fixed lg:sticky lg:top-0 inset-y-0 lg:h-screen left-0 z-[60] lg:z-40 w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 shadow-xl lg:shadow-none
          transform transition-transform duration-200 ease-in-out lg:transform-none
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="flex flex-col h-full">
            {/* 로고 */}
            <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">게임플라자 관리자</h1>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
              </div>
            </div>

            {/* 메뉴 */}
            <nav className="flex-1 p-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/20 scale-[1.02]'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white hover:scale-[1.01]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* 모바일에서만 표시되는 사용자 정보 및 사이트로 돌아가기 */}
            <div className="lg:hidden p-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center overflow-hidden shadow-sm">
                  {session?.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || '프로필'}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium dark:text-white">
                      {session?.user?.name?.[0] || 'A'}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium dark:text-white">
                    {session?.user?.name || '관리자'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
              <Link
                href="/"
                className="flex items-center justify-center gap-2 mt-4 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 hover:scale-[1.02]"
              >
                <ChevronLeft className="w-4 h-4" />
                사이트로 돌아가기
              </Link>
            </div>
          </div>
        </aside>

        {/* 모바일 오버레이 */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-[55] lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* 메인 콘텐츠 */}
        <main className="flex-1 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}