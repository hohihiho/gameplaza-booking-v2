'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// 차트 로딩 컴포넌트
const ChartLoader = () => (
  <div className="flex items-center justify-center h-[300px]">
    <div className="text-center">
      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
      <p className="text-sm text-gray-500">차트 로딩 중...</p>
    </div>
  </div>
);

// 예약 통계 차트 컴포넌트
export const ReservationAnalyticsCharts = dynamic(
  () => import('../analytics/components/ReservationCharts').then(mod => ({ 
    default: mod.ReservationCharts 
  })),
  {
    loading: () => <ChartLoader />,
    ssr: false
  }
);

// 매출 분석 차트 컴포넌트 (임시 주석 처리 - RevenueCharts 컴포넌트 생성 필요)
/*
export const RevenueAnalyticsCharts = dynamic(
  () => import('../analytics/components/RevenueCharts'),
  {
    loading: () => <ChartLoader />,
    ssr: false
  }
);
*/

// 차트 라이브러리를 동적으로 로드
export const loadRecharts = () => import('recharts');