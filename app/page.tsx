'use client';

import QuickReservationWidget from '@/app/components/QuickReservationWidget';
import MainActionButtons from '@/app/components/MainActionButtons';
import PWAInstallBanner from '@/app/components/PWAInstallBanner';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* 히어로 섹션 */}
      <QuickReservationWidget />
      
      {/* 메인 액션 버튼들 */}
      <MainActionButtons />
      
      {/* PWA 설치 배너 */}
      <PWAInstallBanner />
    </div>
  );
}