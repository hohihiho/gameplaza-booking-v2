'use client';

import QuickReservationWidget from '@/app/components/QuickReservationWidget';
import MainActionButtons from '@/app/components/MainActionButtons';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* 히어로 섹션 */}
      <QuickReservationWidget />
      
      {/* 메인 액션 버튼들 */}
      <MainActionButtons />
    </div>
  );
}