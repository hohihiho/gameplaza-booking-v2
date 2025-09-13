// Service Worker 등록 컴포넌트
'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Service Worker 비활성화 - 개발 중에는 사용하지 않음
    console.log('Service Worker가 비활성화되었습니다. 개발 환경에서는 사용하지 않습니다.');

    // 기존에 등록된 Service Worker가 있다면 제거
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
          console.log('기존 Service Worker가 제거되었습니다.');
        });
      });
    }
  }, []);

  return null;
}