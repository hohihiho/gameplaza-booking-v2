'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/push-notifications';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Service Worker 등록 - 프로덕션 환경에서만
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      registerServiceWorker();
    }
  }, []);

  return null;
}