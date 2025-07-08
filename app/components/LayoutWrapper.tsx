'use client';

import DesktopSidebar from './DesktopSidebar';
import BottomTabBar from './BottomTabBar';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* 데스크톱 사이드바 */}
      <DesktopSidebar />
      
      {/* 메인 콘텐츠 */}
      <main className="min-h-screen">
        {children}
      </main>
      
      {/* 모바일 하단 탭바 */}
      <BottomTabBar />
    </>
  );
}