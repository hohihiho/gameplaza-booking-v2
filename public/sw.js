// Service Worker for 광주 게임플라자 PWA
const CACHE_NAME = 'gameplaza-v2';
const STATIC_CACHE = 'gameplaza-static-v2';
const DYNAMIC_CACHE = 'gameplaza-dynamic-v2';
const IMAGE_CACHE = 'gameplaza-images-v2';

// 핵심 리소스 (설치 시 캐시)
const urlsToCache = [
  '/',
  '/offline',
  '/offline.html',
  '/manifest.json',
];

// 캐시 우선순위 설정
const CACHE_STRATEGY = {
  networkFirst: ['/api/', '/auth/', '/supabase/'],
  cacheFirst: ['/_next/static/', '/icons/', '.svg', '.woff2'],
  staleWhileRevalidate: ['/images/', '.jpg', '.png', '.webp'],
};

// 설치 이벤트 - 캐시 초기화
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Failed to cache:', error);
      })
  );
  // 즉시 활성화
  self.skipWaiting();
});

// 활성화 이벤트 - 이전 캐시 정리
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 즉시 제어권 획득
  self.clients.claim();
});

// 페치 이벤트 - 캐싱 전략
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // chrome-extension 스킴 요청은 무시
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Auth API는 캐싱하지 않음
  if (url.pathname.startsWith('/api/auth/')) {
    event.respondWith(
      fetch(request).catch((error) => {
        console.warn('Auth API fetch failed:', error);
        return new Response('Network error', { status: 503 });
      })
    );
    return;
  }

  // 다른 API 요청은 Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 성공적인 응답은 캐시에 저장 (POST 요청과 chrome-extension 제외)
          if (response && response.status === 200 && request.method === 'GET' && !request.url.startsWith('chrome-extension://')) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              })
              .catch((error) => {
                console.warn('Cache put failed:', error);
              });
          }
          return response;
        })
        .catch(() => {
          // 네트워크 실패 시 캐시에서 찾기
          return caches.match(request);
        })
    );
    return;
  }

  // 정적 자산은 Cache First
  if (request.destination === 'image' || 
      request.destination === 'script' || 
      request.destination === 'style' ||
      url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(request).then((response) => {
            // 정적 자산은 캐시에 저장 (chrome-extension 스킴 제외)
            if (response && response.status === 200 && !request.url.startsWith('chrome-extension://')) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                })
                .catch((error) => {
                  console.warn('Cache put failed:', error);
                });
            }
            return response;
          });
        })
    );
    return;
  }

  // HTML 페이지는 Network First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match(request)
            .then((response) => {
              if (response) {
                return response;
              }
              // 오프라인 페이지 반환 (Next.js 페이지 우선)
              return caches.match('/offline').then((offlineResponse) => {
                if (offlineResponse) {
                  return offlineResponse;
                }
                // 폴백으로 HTML 페이지 반환
                return caches.match('/offline.html');
              });
            });
        })
    );
    return;
  }

  // 기타 요청은 Network First  
  event.respondWith(
    fetch(request)
      .then((response) => {
        return response;
      })
      .catch((error) => {
        console.warn('Fetch failed for:', request.url, error);
        return caches.match(request);
      })
  );
});

// 푸시 알림 이벤트 (향후 구현)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '새로운 알림이 있습니다.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '확인하기',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/icons/close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('광주 게임플라자', options)
  );
});

// 알림 클릭 이벤트
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    // 알림 관련 페이지로 이동
    event.waitUntil(
      clients.openWindow('/mypage')
    );
  }
});

// 백그라운드 동기화 (향후 구현)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reservations') {
    event.waitUntil(syncReservations());
  }
});

// 주기적 백그라운드 동기화 (향후 구현)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-reservations') {
    event.waitUntil(updateReservations());
  }
});

// 헬퍼 함수들
async function syncReservations() {
  // 오프라인에서 생성된 예약을 서버와 동기화
  console.log('Syncing reservations...');
}

async function updateReservations() {
  // 예약 상태 업데이트
  console.log('Updating reservations...');
}