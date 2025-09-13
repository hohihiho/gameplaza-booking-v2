'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/push-notifications';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Service Worker 비활성화 - 개발 중에는 사용하지 않음
    console.log('Service Worker Register가 비활성화되었습니다.');

    // 기존에 등록된 Service Worker가 있다면 제거
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
          console.log('Service Worker 등록이 해제되었습니다.');
        });
      });
    }
  }, []);

  return null;
}