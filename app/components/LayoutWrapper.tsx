'use client';

import { usePathname } from 'next/navigation';
import DesktopSidebar from './DesktopSidebar';
import BottomTabBar from './BottomTabBar';
import { ToastContainer } from './mobile';
import { useProfileCheck } from '@/app/hooks/useProfileCheck';
import ServiceWorkerRegistration from './ServiceWorkerRegistration';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // 로그인한 사용자의 프로필 체크
  useProfileCheck();
  
  // 회원가입, 로그인, 이용약관, 환영 페이지에서는 사이드바와 하단바 숨기기
  const hideNavigation = pathname === '/signup' || pathname === '/login' || pathname === '/terms' || pathname === '/welcome';
  
  if (hideNavigation) {
    return (
      <div className="min-h-screen">
        {/* 접근성을 위한 헤더 스킵 링크 */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-md focus:shadow-lg"
        >
          본문으로 바로가기
        </a>
        
        <main id="main-content" className="min-h-screen" role="main" aria-label="메인 콘텐츠">
          {children}
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen">
      {/* 데스크톱 사이드바 - aside 태그로 의미적 마크업 */}
      <aside role="complementary" aria-label="사이드바 네비게이션">
        <DesktopSidebar />
      </aside>
      
      {/* 메인 콘텐츠 영역 - 랜드마크로 명확히 구분 */}
      <main 
        id="main-content"
        className="min-h-screen lg:ml-64 pb-16 md:pb-0" 
        role="main"
        aria-label="메인 콘텐츠"
      >
        {/* 스크린 리더를 위한 페이지 제목 */}
        <h1 className="sr-only">
          {getPageTitle(pathname)}
        </h1>
        {children}
      </main>
      
      {/* 모바일 하단 탭바 - nav 태그로 의미적 마크업 */}
      <nav role="navigation" aria-label="모바일 하단 네비게이션">
        <BottomTabBar />
      </nav>
      
      {/* Toast 메시지 컨테이너 - 알림 영역 */}
      <div role="status" aria-live="polite" aria-label="알림 메시지">
        <ToastContainer />
      </div>
      
      {/* Service Worker 등록 */}
      <ServiceWorkerRegistration />
    </div>
  );
}

// 페이지별 제목 반환 함수
function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    '/': '게임플라자 홈',
    '/reservations': '예약 관리',
    '/reservations/new': '새 예약',
    '/machines': '기기 현황',
    '/schedule': '운영 일정',
    '/mypage': '마이페이지',
    '/admin': '관리자 페이지',
  };
  
  return titles[pathname] || '게임플라자';
}