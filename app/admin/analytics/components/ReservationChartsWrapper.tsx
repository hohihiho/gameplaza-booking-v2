'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// 차트 로딩 컴포넌트
const ChartLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
      <p className="text-sm text-gray-500">차트 로딩 중...</p>
    </div>
  </div>
);

// 동적으로 로드되는 차트 컴포넌트
const ReservationCharts = dynamic(
  () => import('./ReservationCharts').then(mod => ({ default: mod.ReservationCharts })),
  {
    loading: () => <ChartLoader />,
    ssr: false
  }
);

export default ReservationCharts;