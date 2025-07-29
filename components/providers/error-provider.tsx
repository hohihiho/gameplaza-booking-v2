'use client';

import { useEffect } from 'react';
import { setupDefaultInterceptors } from '@/lib/api/error-interceptor';

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 기본 에러 인터셉터 설정
    setupDefaultInterceptors();
  }, []);

  return <>{children}</>;
}