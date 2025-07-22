// Advanced Service Worker for 광주 게임플라자 PWA
const VERSION = '2.0.0';
const CACHE_PREFIX = 'gameplaza';
const CACHE_NAME = `${CACHE_PREFIX}-v${VERSION}`;
const STATIC_CACHE = `${CACHE_PREFIX}-static-v${VERSION}`;
const DYNAMIC_CACHE = `${CACHE_PREFIX}-dynamic-v${VERSION}`;
const IMAGE_CACHE = `${CACHE_PREFIX}-images-v${VERSION}`;

// 캐시 크기 제한
const CACHE_SIZE_LIMIT = {
  [STATIC_CACHE]: 100,
  [DYNAMIC_CACHE]: 50,
  [IMAGE_CACHE]: 30,
};

// 핵심 리소스 (설치 시 캐시)
const CORE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
];

// 캐시 전략 매핑
const CACHE_STRATEGIES = {
  networkFirst: ['/api/', '/auth/', '/supabase/', '.json'],
  cacheFirst: ['/_next/static/', '/icons/', '.svg', '.woff2', '.css', '.js'],
  staleWhileRevalidate: ['/images/', '.jpg', '.png', '.webp'],
  networkOnly: ['/admin/', '/api/admin/'],
  cacheOnly: ['/offline.html'],
};

// 설치 이벤트 - 캐시 초기화
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker version:', VERSION);
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// 활성화 이벤트 - 이전 캐시 정리
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker version:', VERSION);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX))
            .filter((cacheName) => !Object.values({STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE}).includes(cacheName))
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 페치 이벤트 - 고급 캐싱 전략
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // POST 요청은 항상 네트워크로
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }
  
  // 캐시 전략 결정
  const strategy = getStrategy(url.pathname);
  
  switch (strategy) {
    case 'networkFirst':
      event.respondWith(networkFirst(request));
      break;
    case 'cacheFirst':
      event.respondWith(cacheFirst(request));
      break;
    case 'staleWhileRevalidate':
      event.respondWith(staleWhileRevalidate(request));
      break;
    case 'networkOnly':
      event.respondWith(networkOnly(request));
      break;
    case 'cacheOnly':
      event.respondWith(cacheOnly(request));
      break;
    default:
      event.respondWith(networkFirst(request));
  }
});

// 전략 결정 함수
function getStrategy(pathname) {
  for (const [strategy, patterns] of Object.entries(CACHE_STRATEGIES)) {
    if (patterns.some(pattern => pathname.includes(pattern))) {
      return strategy;
    }
  }
  return 'networkFirst';
}

// Network First 전략
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      await trimCache(DYNAMIC_CACHE, CACHE_SIZE_LIMIT[DYNAMIC_CACHE]);
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 네비게이션 요청인 경우 오프라인 페이지 반환
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Cache First 전략
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      await trimCache(STATIC_CACHE, CACHE_SIZE_LIMIT[STATIC_CACHE]);
    }
    
    return networkResponse;
  } catch (error) {
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    throw error;
  }
}

// Stale While Revalidate 전략
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse.ok) {
        const cache = await caches.open(IMAGE_CACHE);
        cache.put(request, networkResponse.clone());
        await trimCache(IMAGE_CACHE, CACHE_SIZE_LIMIT[IMAGE_CACHE]);
      }
      return networkResponse;
    })
    .catch(() => {
      return cachedResponse || new Response('Network error', { status: 503 });
    });
  
  return cachedResponse || fetchPromise;
}

// Network Only 전략
async function networkOnly(request) {
  return fetch(request);
}

// Cache Only 전략
async function cacheOnly(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  return new Response('Not found in cache', { status: 404 });
}

// 캐시 크기 제한 함수
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    await trimCache(cacheName, maxItems);
  }
}

// 백그라운드 동기화
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-reservations') {
    event.waitUntil(syncReservations());
  }
});

// 예약 동기화 함수
async function syncReservations() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    const syncRequests = requests.filter(req => req.url.includes('/api/reservations/sync'));
    
    for (const request of syncRequests) {
      try {
        const cachedResponse = await cache.match(request);
        const data = await cachedResponse.json();
        
        const response = await fetch('/api/reservations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (response.ok) {
          await cache.delete(request);
        }
      } catch (error) {
        console.error('[SW] Sync failed for:', request.url, error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync reservations failed:', error);
  }
}

// 푸시 알림
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '새로운 알림이 있습니다.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'gameplaza-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: '확인하기',
      },
      {
        action: 'dismiss',
        title: '닫기',
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('광주 게임플라자', options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url === '/' && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow('/mypage');
          }
        })
    );
  }
});

// 메시지 리스너
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX))
            .map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('[SW] Service Worker loaded successfully');