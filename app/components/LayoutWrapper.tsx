'use client';

import { usePathname } from 'next/navigation';
import DesktopSidebar from './DesktopSidebar';
import BottomTabBar from './BottomTabBar';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // 회원가입, 로그인, 이용약관, 환영 페이지에서는 사이드바와 하단바 숨기기
  const hideNavigation = pathname === '/signup' || pathname === '/login' || pathname === '/terms' || pathname === '/welcome';
  
  if (hideNavigation) {
    return (
      <main className="min-h-screen">
        {children}
      </main>
    );
  }
  
  return (
    <>
      {/* 데스크톱 사이드바 */}
      <DesktopSidebar />
      
      {/* 메인 콘텐츠 - 데스크톱에서는 사이드바 너비만큼 왼쪽 마진, 모바일에서는 하단 탭바 높이만큼 아래 패딩 */}
      <main className="min-h-screen lg:ml-64 pb-16 md:pb-0">
        {children}
      </main>
      
      {/* 모바일 하단 탭바 */}
      <BottomTabBar />
    </>
  );
}