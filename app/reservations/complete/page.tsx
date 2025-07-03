// 예약 완료 페이지
// 비전공자 설명: 예약이 성공적으로 완료되었을 때 보여주는 페이지입니다
import { Suspense } from 'react';
import ReservationCompleteContent from './page-content';

export default function ReservationCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    }>
      <ReservationCompleteContent />
    </Suspense>
  );
}