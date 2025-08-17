'use client';

import { useEffect } from 'react';
import { termsCache } from '@/lib/terms-cache';

interface TermsPreloaderProps {
  children: React.ReactNode;
}

export function TermsPreloader({ children }: TermsPreloaderProps) {
  useEffect(() => {
    // 앱 시작 시 자주 사용되는 약관들을 프리로드
    const preloadTerms = async () => {
      try {
        await termsCache.preload(['terms_of_service', 'privacy_policy']);
      } catch (error) {
        // 프리로드 실패는 조용히 처리 (사용자 경험에 영향 없음)
        console.warn('Terms preload failed:', error);
      }
    };

    preloadTerms();
  }, []);

  return <>{children}</>;
}