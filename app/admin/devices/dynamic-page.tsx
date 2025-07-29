// 기기 관리 페이지 - 동적 로딩 래퍼
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const DevicesPage = dynamic(
  () => import('./page'),
  {
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600 dark:text-gray-400">기기 관리 로딩 중...</p>
        </div>
      </div>
    ),
    ssr: false
  }
);

export default DevicesPage;