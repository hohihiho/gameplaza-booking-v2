'use client';

import QuickReservationWidget from '@/app/components/QuickReservationWidget';
import MainActionButtons from '@/app/components/MainActionButtons';
import BottomTabBar from '@/app/components/BottomTabBar';
import DesktopSidebar from '@/app/components/DesktopSidebar';

export default function Home() {
  return (
    <div className="min-h-screen relative">
      {/* 데스크탑 사이드바 */}
      <DesktopSidebar />
      
      {/* 메인 콘텐츠 */}
      <div className="lg:ml-64">
        {/* 히어로 섹션 */}
        <QuickReservationWidget />
        
        {/* 메인 액션 버튼들 */}
        <MainActionButtons />
      </div>
      
      {/* 모바일 하단 탭바 */}
      <div className="lg:hidden">
        <BottomTabBar />
      </div>
    </div>
  );
}