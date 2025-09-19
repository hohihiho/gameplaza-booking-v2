// Service Worker 등록 컴포넌트
'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Service Worker는 HTTPS나 localhost에서만 작동
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker 등록 성공:', registration);

          // 업데이트 확인
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // 새로운 버전 사용 가능
                  console.log('새로운 버전이 사용 가능합니다');
                  
                  // 사용자에게 업데이트 알림 (옵션)
                  if (confirm('새로운 버전이 있습니다. 페이지를 새로고침하시겠습니까?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        } catch (error) {
          console.error('Service Worker 등록 실패:', error);
        }
      });
    }
  }, []);

  return null;
}