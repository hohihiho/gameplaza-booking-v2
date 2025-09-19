'use client';

import { useState, useEffect } from 'react';
import AppSplashScreen from '@/app/components/AppSplashScreen';
import QuickReservationWidget from '@/app/components/QuickReservationWidget';
import MainActionButtons from '@/app/components/MainActionButtons';
import PWAInstallBanner from '@/app/components/PWAInstallBanner';
import Footer from '@/app/components/Footer';

export default function Home() {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // 세션 스토리지 체크 - 스플래시를 이미 봤는지 확인
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');

    if (hasSeenSplash) {
      // 이미 봤다면 바로 콘텐츠 표시
      setShowContent(true);
    } else {
      // 처음 방문이면 스플래시 후에 콘텐츠 표시
      setTimeout(() => {
        setShowContent(true);
      }, 3000); // 스플래시 화면 표시 시간
    }
  }, []);

  return (
    <div className="min-h-screen">
      <AppSplashScreen />

      {/* 스플래시 화면 후에만 메인 콘텐츠 표시 */}
      {showContent && (
        <>
          {/* 히어로 섹션 */}
          <QuickReservationWidget />

          {/* 메인 액션 버튼들 */}
          <MainActionButtons />

          {/* PWA 설치 배너 */}
          <PWAInstallBanner />


          {/* Footer */}
          <Footer />
        </>
      )}
    </div>
  );
}
