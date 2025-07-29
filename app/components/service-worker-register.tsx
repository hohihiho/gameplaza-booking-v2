'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/push-notifications';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Service Worker 등록
    if ('serviceWorker' in navigator) {
      // 개발 환경에서도 PWA 테스트를 위해 Service Worker 등록
      registerServiceWorker();
    }
  }, []);

  return null;
}