'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/push-notifications';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Service Worker 등록
    if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
      registerServiceWorker();
    }
  }, []);

  return null;
}