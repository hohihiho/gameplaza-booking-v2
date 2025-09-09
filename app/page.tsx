'use client';

import QuickReservationWidget from '@/app/components/QuickReservationWidget';
import MainActionButtons from '@/app/components/MainActionButtons';
import PWAInstallBanner from '@/app/components/PWAInstallBanner';
import Footer from '@/app/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* 히어로 섹션 */}
      <QuickReservationWidget />
      
      {/* 메인 액션 버튼들 */}
      <MainActionButtons />
      
      {/* PWA 설치 배너 */}
      <PWAInstallBanner />
      
      {/* 개인정보처리방침 링크 섹션 - Google Play 봇 인식을 위해 명확하게 표시 */}
      <div className="px-4 py-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            서비스 이용 시 아래 정책을 확인해주세요
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4">
            <a 
              href="/privacy" 
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              rel="privacy-policy"
              title="개인정보처리방침"
            >
              📋 개인정보처리방침
            </a>
            <a 
              href="/terms" 
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              rel="terms-of-service"
              title="서비스 이용약관"
            >
              📜 서비스 이용약관
            </a>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}