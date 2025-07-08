'use client';

import DesktopSidebar from './DesktopSidebar';
import BottomTabBar from './BottomTabBar';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
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