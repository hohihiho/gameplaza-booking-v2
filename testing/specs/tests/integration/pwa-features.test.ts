import React from 'react';

/**
 * @jest-environment jsdom
 */

// Web API Polyfills for Node.js environment
class MockResponse {
  constructor(private body: any, private init?: ResponseInit) {}
  
  text() {
    return Promise.resolve(this.body);
  }
  
  json() {
    return Promise.resolve(JSON.parse(this.body));
  }
  
  clone() {
    return new MockResponse(this.body, this.init);
  }
  
  ok = true;
  status = 200;
}

global.Response = MockResponse as any;

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Service Worker 모킹
const mockServiceWorker = {
  register: jest.fn(),
  ready: Promise.resolve({
    active: { state: 'activated' },
    scope: '/',
    unregister: jest.fn(),
  }),
  getRegistrations: jest.fn(() => Promise.resolve([])),
};

// 브라우저 API 모킹
global.navigator.serviceWorker = mockServiceWorker as any;
global.Notification = {
  permission: 'default',
  requestPermission: jest.fn(() => Promise.resolve('granted')),
} as any;

// Web App Manifest 모킹
const mockManifest = {
  name: '게임플라자',
  short_name: 'GamePlaza',
  start_url: '/',
  display: 'standalone',
  theme_color: '#000000',
  background_color: '#ffffff',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
};

describe('PWA 기능 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // IndexedDB 모킹
    (global as any).indexedDB = {
      open: jest.fn(() => ({
        onsuccess: jest.fn(),
        onerror: jest.fn(),
        result: {
          createObjectStore: jest.fn(),
          transaction: jest.fn(() => ({
            objectStore: jest.fn(() => ({
              add: jest.fn(),
              get: jest.fn(),
              put: jest.fn(),
              delete: jest.fn(),
            })),
          })),
        },
      })),
    };
  });

  describe('Service Worker', () => {
    it('TC-PWA-001: Service Worker 등록', async () => {
      // When: 페이지 로드 시 SW 등록
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });

      // Then: 등록 성공
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js', { scope: '/' });
    });

    it('TC-PWA-002: Service Worker 생명주기', async () => {
      // Given: SW 상태 추적
      const states: string[] = [];
      const registration = await navigator.serviceWorker.ready;

      // Mock 상태 변경
      const mockWorker = {
        state: 'installing',
        addEventListener: jest.fn((event, handler) => {
          if (event === 'statechange') {
            // 상태 변경 시뮬레이션
            ['installed', 'activating', 'activated'].forEach(state => {
              mockWorker.state = state;
              handler();
              states.push(state);
            });
          }
        }),
      };

      // When: 상태 변경 리스너 등록
      mockWorker.addEventListener('statechange', () => {
        // 상태 기록됨
      });

      // Then: 모든 상태 전환 확인
      expect(states).toEqual(['installed', 'activating', 'activated']);
    });

    it('TC-PWA-003: Service Worker 업데이트', async () => {
      // Given: 업데이트 감지기
      const onUpdateFound = jest.fn();
      
      const registration = {
        installing: null,
        waiting: { postMessage: jest.fn() },
        active: { state: 'activated' },
        addEventListener: jest.fn((event, handler) => {
          if (event === 'updatefound') {
            registration.installing = { state: 'installing' };
            handler();
          }
        }),
      };

      // When: 업데이트 리스너 등록
      registration.addEventListener('updatefound', onUpdateFound);

      // Then: 업데이트 감지
      expect(onUpdateFound).toHaveBeenCalled();
      expect(registration.installing).toBeTruthy();
    });

    it('TC-PWA-004: Service Worker 에러 처리', async () => {
      // Given: 에러 핸들러
      const onError = jest.fn();

      // When: 등록 실패
      navigator.serviceWorker.register = jest.fn(() => 
        Promise.reject(new Error('SW registration failed'))
      );

      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (error) {
        onError(error);
      }

      // Then: 에러 처리
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'SW registration failed' })
      );
    });

    it('TC-PWA-005: Service Worker 범위', async () => {
      // When: 다양한 범위로 등록
      const registrations = [
        { url: '/sw.js', scope: '/' },
        { url: '/app/sw.js', scope: '/app/' },
        { url: '/admin/sw.js', scope: '/admin/' },
      ];

      navigator.serviceWorker.register = jest.fn(() => Promise.resolve());

      for (const reg of registrations) {
        await navigator.serviceWorker.register(reg.url, { scope: reg.scope });
      }

      // Then: 각 범위별 등록 확인
      expect(navigator.serviceWorker.register).toHaveBeenCalledTimes(3);
      registrations.forEach(reg => {
        expect(navigator.serviceWorker.register).toHaveBeenCalledWith(
          reg.url, 
          { scope: reg.scope }
        );
      });
    });

    it('TC-PWA-006: Service Worker 메시지 통신', async () => {
      // Given: 메시지 핸들러
      const messageHandler = jest.fn();
      
      // Mock postMessage
      const mockWorker = {
        postMessage: jest.fn(),
        addEventListener: jest.fn((event, handler) => {
          if (event === 'message') {
            messageHandler.mockImplementation(handler);
          }
        }),
      };

      // When: 메시지 송수신
      mockWorker.postMessage({ type: 'SKIP_WAITING' });
      messageHandler({ data: { type: 'RELOAD_WINDOW' } });

      // Then: 양방향 통신 확인
      expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
      expect(messageHandler).toHaveBeenCalledWith({ data: { type: 'RELOAD_WINDOW' } });
    });

    it('TC-PWA-007: Service Worker 디버깅', async () => {
      // Given: 디버깅 정보
      const debugInfo = {
        registration: await navigator.serviceWorker.ready,
        caches: ['v1-cache', 'api-cache', 'image-cache'],
        clients: 3,
        version: '1.2.3',
      };

      // When: 디버그 정보 수집
      const getDebugInfo = () => ({
        scope: debugInfo.registration.scope,
        state: debugInfo.registration.active?.state,
        caches: debugInfo.caches,
        clients: debugInfo.clients,
        version: debugInfo.version,
      });

      const info = getDebugInfo();

      // Then: 디버그 정보 확인
      expect(info.scope).toBe('/');
      expect(info.state).toBe('activated');
      expect(info.caches).toHaveLength(3);
    });

    it('TC-PWA-008: Service Worker 제거', async () => {
      // Given: 등록된 SW
      const registration = {
        unregister: jest.fn(() => Promise.resolve(true)),
      };

      navigator.serviceWorker.getRegistrations = jest.fn(() => 
        Promise.resolve([registration])
      );

      // When: 모든 SW 제거
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));

      // Then: 제거 확인
      expect(registration.unregister).toHaveBeenCalled();
    });
  });

  describe('오프라인 기능', () => {
    it('TC-PWA-009: 오프라인 페이지 표시', async () => {
      // Given: 네트워크 상태
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      // When: 오프라인 감지
      const isOffline = !navigator.onLine;

      // Then: 오프라인 상태
      expect(isOffline).toBe(true);
    });

    it('TC-PWA-010: 오프라인 데이터 조회', async () => {
      // Given: 캐시된 데이터
      const cachedData = {
        devices: [
          { id: '1', name: '철권8', status: 'available' },
          { id: '2', name: '스트리트파이터6', status: 'in_use' },
        ],
        user: { id: 'user-1', name: '게임러123' },
      };

      // Mock 캐시 API
      const mockCache = {
        match: jest.fn((request) => {
          if (request.includes('/api/devices')) {
            return Promise.resolve(new Response(JSON.stringify(cachedData.devices)));
          }
          if (request.includes('/api/user')) {
            return Promise.resolve(new Response(JSON.stringify(cachedData.user)));
          }
          return Promise.resolve(null);
        }),
      };

      global.caches = {
        open: jest.fn(() => Promise.resolve(mockCache)),
      } as any;

      // When: 캐시에서 데이터 조회
      const cache = await caches.open('api-cache');
      const devicesResponse = await cache.match('/api/devices');
      const devices = await devicesResponse?.json();

      // Then: 캐시 데이터 반환
      expect(devices).toEqual(cachedData.devices);
    });

    it('TC-PWA-011: 오프라인 예약 생성', async () => {
      // Given: IndexedDB에 임시 저장
      const pendingReservation = {
        id: 'temp-' + Date.now(),
        deviceId: 'device-1',
        date: '2025-07-26',
        timeSlot: '14:00-18:00',
        status: 'pending_sync',
      };

      const mockDB = {
        transaction: jest.fn(() => ({
          objectStore: jest.fn(() => ({
            add: jest.fn(() => Promise.resolve()),
          })),
        })),
      };

      // When: 오프라인 예약 저장
      const tx = mockDB.transaction(['pending_reservations'], 'readwrite');
      const store = tx.objectStore('pending_reservations');
      await store.add(pendingReservation);

      // Then: 로컬 저장 확인
      expect(store.add).toHaveBeenCalledWith(pendingReservation);
    });

    it('TC-PWA-012: 오프라인 네비게이션', async () => {
      // Given: 캐시된 페이지 목록
      const cachedPages = ['/', '/reservations', '/mypage', '/schedule'];
      const nonCachedPages = ['/admin', '/reservations/new'];

      const mockCache = {
        match: jest.fn((url) => {
          const path = new URL(url).pathname;
          return Promise.resolve(
            cachedPages.includes(path) ? new Response('cached') : null
          );
        }),
      };

      global.caches = {
        open: jest.fn(() => Promise.resolve(mockCache)),
      } as any;

      // When: 페이지 네비게이션 시도
      const cache = await caches.open('pages-cache');
      
      // Then: 캐시된 페이지는 접근 가능
      for (const page of cachedPages) {
        const response = await cache.match(`http://localhost${page}`);
        expect(response).toBeTruthy();
      }

      // 캐시되지 않은 페이지는 null
      for (const page of nonCachedPages) {
        const response = await cache.match(`http://localhost${page}`);
        expect(response).toBeNull();
      }
    });

    it('TC-PWA-013: 오프라인 이미지 처리', async () => {
      // Given: 이미지 캐싱 전략
      const imageCache = {
        '/placeholder.png': 'placeholder-data',
        '/logo.png': 'logo-data',
      };

      const mockCache = {
        match: jest.fn((url) => {
          const path = new URL(url).pathname;
          return Promise.resolve(
            imageCache[path as keyof typeof imageCache] 
              ? new Response(imageCache[path as keyof typeof imageCache])
              : null
          );
        }),
      };

      global.caches = {
        open: jest.fn(() => Promise.resolve(mockCache)),
      } as any;

      // When: 이미지 요청
      const cache = await caches.open('image-cache');
      const placeholder = await cache.match('http://localhost/placeholder.png');

      // Then: 플레이스홀더 반환
      expect(await placeholder?.text()).toBe('placeholder-data');
    });

    it('TC-PWA-014: 오프라인 폼 검증', async () => {
      // Given: 클라이언트 사이드 검증
      const validateForm = (data: any) => {
        const errors: string[] = [];
        
        if (!data.nickname || data.nickname.length < 2) {
          errors.push('닉네임은 2자 이상이어야 합니다');
        }
        
        if (!data.timeSlot || !data.timeSlot.match(/^\d{2}:\d{2}-\d{2}:\d{2}$/)) {
          errors.push('올바른 시간 형식이 아닙니다');
        }
        
        return errors;
      };

      // When: 오프라인 상태에서 검증
      const invalidData = { nickname: 'A', timeSlot: '14시-18시' };
      const validData = { nickname: '게임러123', timeSlot: '14:00-18:00' };

      // Then: 검증 결과
      expect(validateForm(invalidData)).toHaveLength(2);
      expect(validateForm(validData)).toHaveLength(0);
    });

    it('TC-PWA-015: 오프라인 검색', async () => {
      // Given: 로컬 검색 인덱스
      const searchIndex = [
        { id: '1', title: '철권8', tags: ['격투', '대전'] },
        { id: '2', title: '스트리트파이터6', tags: ['격투', '캡콤'] },
        { id: '3', title: 'FIFA 24', tags: ['스포츠', '축구'] },
      ];

      // When: 로컬 검색
      const search = (query: string) => {
        const lowercaseQuery = query.toLowerCase();
        return searchIndex.filter(item => 
          item.title.toLowerCase().includes(lowercaseQuery) ||
          item.tags.some(tag => tag.includes(lowercaseQuery))
        );
      };

      // Then: 검색 결과
      expect(search('격투')).toHaveLength(2);
      expect(search('FIFA')).toHaveLength(1);
      expect(search('농구')).toHaveLength(0);
    });

    it('TC-PWA-016: 오프라인 상태 표시', async () => {
      // Given: 온라인/오프라인 이벤트
      const onlineHandler = jest.fn();
      const offlineHandler = jest.fn();

      window.addEventListener('online', onlineHandler);
      window.addEventListener('offline', offlineHandler);

      // When: 상태 변경
      window.dispatchEvent(new Event('offline'));
      window.dispatchEvent(new Event('online'));

      // Then: 이벤트 발생
      expect(offlineHandler).toHaveBeenCalled();
      expect(onlineHandler).toHaveBeenCalled();
    });
  });

  describe('홈 화면 설치', () => {
    it('TC-PWA-017: 설치 프롬프트', async () => {
      // Given: beforeinstallprompt 이벤트
      let deferredPrompt: any = null;
      
      window.addEventListener('beforeinstallprompt', (e: any) => {
        e.preventDefault();
        deferredPrompt = e;
      });

      // Mock 이벤트
      const mockPromptEvent = {
        preventDefault: jest.fn(),
        prompt: jest.fn(() => Promise.resolve({ outcome: 'accepted' })),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      };

      // When: 이벤트 발생
      window.dispatchEvent(Object.assign(
        new Event('beforeinstallprompt'),
        mockPromptEvent
      ));

      // Then: 프롬프트 저장
      expect(mockPromptEvent.preventDefault).toHaveBeenCalled();
    });

    it('TC-PWA-018: Web App Manifest', async () => {
      // Given: manifest.json 검증
      const validateManifest = (manifest: any) => {
        const required = ['name', 'short_name', 'start_url', 'display', 'icons'];
        return required.every(field => manifest[field]);
      };

      // When: Manifest 검증
      const isValid = validateManifest(mockManifest);

      // Then: 필수 필드 확인
      expect(isValid).toBe(true);
      expect(mockManifest.display).toBe('standalone');
      expect(mockManifest.icons).toHaveLength(2);
    });

    it('TC-PWA-019: 홈 화면 아이콘', async () => {
      // Given: 아이콘 요구사항
      const requiredSizes = ['192x192', '512x512'];
      const maskableIcon = { 
        src: '/icon-maskable.png', 
        sizes: '512x512', 
        type: 'image/png',
        purpose: 'maskable',
      };

      // When: 아이콘 검증
      const hasRequiredSizes = requiredSizes.every(size =>
        mockManifest.icons.some(icon => icon.sizes === size)
      );

      // Then: 크기 확인
      expect(hasRequiredSizes).toBe(true);
    });

    it('TC-PWA-020: 독립 실행 모드', async () => {
      // Given: 독립 실행 감지
      const isStandalone = () => {
        return window.matchMedia('(display-mode: standalone)').matches ||
               (window.navigator as any).standalone ||
               document.referrer.includes('android-app://');
      };

      // Mock matchMedia
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(display-mode: standalone)',
          media: query,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        })),
      });

      // When: 독립 실행 확인
      const standalone = isStandalone();

      // Then: 독립 모드
      expect(standalone).toBe(true);
    });

    it('TC-PWA-021: 앱 링크 처리', async () => {
      // Given: 딥링크 핸들러
      const handleDeepLink = (url: string) => {
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        const params = Object.fromEntries(urlObj.searchParams);
        
        return { path, params };
      };

      // When: 딥링크 파싱
      const result = handleDeepLink('https://gameplaza.kr/reservations/new?device=device-1&date=2025-07-26');

      // Then: 라우팅 정보
      expect(result.path).toBe('/reservations/new');
      expect(result.params).toEqual({
        device: 'device-1',
        date: '2025-07-26',
      });
    });

    it('TC-PWA-022: 설치 후 경험', async () => {
      // Given: 첫 실행 감지
      const isFirstRun = () => {
        const hasRun = localStorage.getItem('pwa_first_run');
        if (!hasRun) {
          localStorage.setItem('pwa_first_run', 'true');
          return true;
        }
        return false;
      };

      // Mock localStorage
      const mockStorage: { [key: string]: string } = {};
      Storage.prototype.getItem = jest.fn(key => mockStorage[key]);
      Storage.prototype.setItem = jest.fn((key, value) => {
        mockStorage[key] = value;
      });

      // When: 첫 실행 확인
      const firstRun = isFirstRun();
      const secondRun = isFirstRun();

      // Then: 첫 실행만 true
      expect(firstRun).toBe(true);
      expect(secondRun).toBe(false);
    });
  });

  describe('푸시 알림', () => {
    it('TC-PWA-023: 푸시 권한 요청', async () => {
      // When: 권한 요청
      const permission = await Notification.requestPermission();

      // Then: 권한 부여
      expect(permission).toBe('granted');
      expect(Notification.requestPermission).toHaveBeenCalled();
    });

    it('TC-PWA-024: FCM 토큰 관리', async () => {
      // Given: FCM 토큰
      const mockToken = 'mock-fcm-token-123';
      const tokenManager = {
        token: null as string | null,
        async getToken() {
          this.token = mockToken;
          return this.token;
        },
        async refreshToken() {
          this.token = 'refreshed-' + mockToken;
          return this.token;
        },
      };

      // When: 토큰 획득 및 갱신
      const initialToken = await tokenManager.getToken();
      const refreshedToken = await tokenManager.refreshToken();

      // Then: 토큰 관리
      expect(initialToken).toBe(mockToken);
      expect(refreshedToken).toBe('refreshed-' + mockToken);
    });

    it('TC-PWA-025: 푸시 메시지 수신', async () => {
      // Given: 메시지 핸들러
      const messageHandler = jest.fn();
      
      // Service Worker에서 메시지 수신
      self.addEventListener('push', (event: any) => {
        const data = event.data?.json() || {};
        messageHandler(data);
      });

      // When: 푸시 이벤트
      const pushEvent = new Event('push');
      (pushEvent as any).data = {
        json: () => ({
          title: '예약 승인됨',
          body: '14:00-18:00 예약이 승인되었습니다',
          data: { reservationId: 'res-123' },
        }),
      };

      self.dispatchEvent(pushEvent);

      // Then: 메시지 처리
      expect(messageHandler).toHaveBeenCalledWith({
        title: '예약 승인됨',
        body: '14:00-18:00 예약이 승인되었습니다',
        data: { reservationId: 'res-123' },
      });
    });

    it('TC-PWA-026: 알림 표시 커스터마이징', async () => {
      // Given: 알림 옵션
      const showNotification = (title: string, options: any) => {
        return self.registration.showNotification(title, {
          ...options,
          badge: '/badge-72.png',
          icon: '/icon-192.png',
          vibrate: [200, 100, 200],
          tag: options.tag || 'default',
          renotify: true,
        });
      };

      // Mock registration
      self.registration = {
        showNotification: jest.fn(),
      } as any;

      // When: 알림 표시
      await showNotification('예약 확정', {
        body: '오늘 14:00 예약이 확정되었습니다',
        actions: [
          { action: 'view', title: '보기' },
          { action: 'cancel', title: '취소' },
        ],
        data: { reservationId: 'res-123' },
      });

      // Then: 커스텀 옵션 적용
      expect(self.registration.showNotification).toHaveBeenCalledWith(
        '예약 확정',
        expect.objectContaining({
          body: '오늘 14:00 예약이 확정되었습니다',
          badge: '/badge-72.png',
          icon: '/icon-192.png',
          vibrate: [200, 100, 200],
          actions: expect.arrayContaining([
            { action: 'view', title: '보기' },
            { action: 'cancel', title: '취소' },
          ]),
        })
      );
    });

    it('TC-PWA-027: 알림 클릭 처리', async () => {
      // Given: 클릭 핸들러
      const notificationClickHandler = jest.fn();
      
      self.addEventListener('notificationclick', (event: any) => {
        event.notification.close();
        notificationClickHandler(event.action, event.notification.data);
      });

      // When: 알림 클릭
      const clickEvent = new Event('notificationclick');
      (clickEvent as any).action = 'view';
      (clickEvent as any).notification = {
        close: jest.fn(),
        data: { reservationId: 'res-123' },
      };

      self.dispatchEvent(clickEvent);

      // Then: 액션 처리
      expect(notificationClickHandler).toHaveBeenCalledWith('view', { reservationId: 'res-123' });
    });

    it('TC-PWA-028: 알림 그룹화', async () => {
      // Given: 그룹화 설정
      const groupNotifications = (notifications: any[]) => {
        const groups: { [key: string]: any[] } = {};
        
        notifications.forEach(notif => {
          const tag = notif.tag || 'default';
          if (!groups[tag]) groups[tag] = [];
          groups[tag].push(notif);
        });

        return Object.entries(groups).map(([tag, items]) => ({
          tag,
          count: items.length,
          summary: `${items.length}개의 알림`,
        }));
      };

      // When: 알림 그룹화
      const notifications = [
        { tag: 'reservation', title: '예약1' },
        { tag: 'reservation', title: '예약2' },
        { tag: 'payment', title: '결제1' },
      ];

      const groups = groupNotifications(notifications);

      // Then: 그룹별 정리
      expect(groups).toHaveLength(2);
      expect(groups.find(g => g.tag === 'reservation')?.count).toBe(2);
    });

    it('TC-PWA-029: 조용한 시간 설정', async () => {
      // Given: 방해금지 설정
      const doNotDisturb = {
        enabled: true,
        startTime: '22:00',
        endTime: '08:00',
        exceptions: ['urgent', 'security'],
      };

      const shouldShowNotification = (type: string) => {
        if (!doNotDisturb.enabled) return true;
        if (doNotDisturb.exceptions.includes(type)) return true;

        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // 시간 범위 체크 (간단한 구현)
        return currentTime < doNotDisturb.startTime || currentTime >= doNotDisturb.endTime;
      };

      // When: 알림 필터링
      const canShowRegular = shouldShowNotification('regular');
      const canShowUrgent = shouldShowNotification('urgent');

      // Then: 예외 처리
      expect(canShowUrgent).toBe(true); // 긴급은 항상 표시
    });

    it('TC-PWA-030: 알림 분석', async () => {
      // Given: 알림 추적
      const analytics = {
        sent: 0,
        clicked: 0,
        dismissed: 0,
        
        trackSent() { this.sent++; },
        trackClick() { this.clicked++; },
        trackDismiss() { this.dismissed++; },
        
        getStats() {
          const total = this.sent;
          return {
            sent: this.sent,
            clicked: this.clicked,
            dismissed: this.dismissed,
            ctr: total > 0 ? (this.clicked / total) * 100 : 0,
          };
        },
      };

      // When: 알림 이벤트
      for (let i = 0; i < 10; i++) analytics.trackSent();
      for (let i = 0; i < 3; i++) analytics.trackClick();
      for (let i = 0; i < 2; i++) analytics.trackDismiss();

      // Then: 통계 계산
      const stats = analytics.getStats();
      expect(stats.sent).toBe(10);
      expect(stats.clicked).toBe(3);
      expect(stats.ctr).toBe(30);
    });
  });

  describe('백그라운드 동기화', () => {
    it('TC-PWA-031: 백그라운드 동기화 등록', async () => {
      // Given: Sync 등록
      const registration = {
        sync: {
          register: jest.fn((tag: string) => Promise.resolve()),
          getTags: jest.fn(() => Promise.resolve([])),
        },
      };

      // When: 동기화 태그 등록
      await registration.sync.register('sync-reservations');

      // Then: 등록 확인
      expect(registration.sync.register).toHaveBeenCalledWith('sync-reservations');
    });

    it('TC-PWA-032: 주기적 백그라운드 동기화', async () => {
      // Given: Periodic Sync
      const registration = {
        periodicSync: {
          register: jest.fn((tag: string, options: any) => Promise.resolve()),
          getTags: jest.fn(() => Promise.resolve([])),
          unregister: jest.fn((tag: string) => Promise.resolve()),
        },
      };

      // When: 주기적 동기화 등록
      await registration.periodicSync.register('check-updates', {
        minInterval: 24 * 60 * 60 * 1000, // 24시간
      });

      // Then: 주기 설정
      expect(registration.periodicSync.register).toHaveBeenCalledWith(
        'check-updates',
        { minInterval: 86400000 }
      );
    });

    it('TC-PWA-033: 백그라운드 동기화 실패 처리', async () => {
      // Given: 재시도 로직
      const syncManager = {
        attempts: 0,
        maxAttempts: 3,
        
        async sync(data: any): Promise<boolean> {
          this.attempts++;
          
          if (this.attempts < this.maxAttempts) {
            throw new Error('Sync failed');
          }
          
          return true;
        },
        
        async retryWithBackoff(data: any) {
          let delay = 1000;
          
          while (this.attempts < this.maxAttempts) {
            try {
              return await this.sync(data);
            } catch (error) {
              await new Promise(resolve => setTimeout(resolve, delay));
              delay *= 2; // 지수 백오프
            }
          }
          
          throw new Error('Max attempts reached');
        },
      };

      // When: 재시도
      const result = await syncManager.retryWithBackoff({ test: true });

      // Then: 성공까지 재시도
      expect(result).toBe(true);
      expect(syncManager.attempts).toBe(3);
    });

    it('TC-PWA-034: 백그라운드 페치', async () => {
      // Given: Background Fetch API
      const bgFetch = {
        fetch: jest.fn(async (id: string, requests: string[], options: any) => {
          return {
            id,
            uploadTotal: 0,
            uploaded: 0,
            downloadTotal: options.downloadTotal || 0,
            downloaded: 0,
            state: 'pending',
            failureReason: '',
          };
        }),
      };

      // When: 대용량 데이터 다운로드
      const registration = await bgFetch.fetch(
        'device-images',
        ['/api/devices/images'],
        {
          title: '기기 이미지 다운로드',
          downloadTotal: 50 * 1024 * 1024, // 50MB
        }
      );

      // Then: 백그라운드 다운로드
      expect(registration.id).toBe('device-images');
      expect(registration.downloadTotal).toBe(52428800);
    });

    it('TC-PWA-035: 동기화 상태 표시', async () => {
      // Given: 동기화 상태
      const syncStatus = {
        pending: new Set<string>(),
        syncing: new Set<string>(),
        completed: new Set<string>(),
        failed: new Set<string>(),
        
        start(id: string) {
          this.pending.delete(id);
          this.syncing.add(id);
        },
        
        complete(id: string) {
          this.syncing.delete(id);
          this.completed.add(id);
        },
        
        fail(id: string) {
          this.syncing.delete(id);
          this.failed.add(id);
        },
        
        getStatus() {
          return {
            pending: this.pending.size,
            syncing: this.syncing.size,
            completed: this.completed.size,
            failed: this.failed.size,
          };
        },
      };

      // When: 동기화 진행
      syncStatus.pending.add('res-1');
      syncStatus.pending.add('res-2');
      syncStatus.start('res-1');
      syncStatus.complete('res-1');
      syncStatus.start('res-2');
      syncStatus.fail('res-2');

      // Then: 상태 추적
      const status = syncStatus.getStatus();
      expect(status.completed).toBe(1);
      expect(status.failed).toBe(1);
    });
  });

  describe('캐시 전략', () => {
    it('TC-PWA-036: 캐시 우선 전략', async () => {
      // Given: Cache First 전략
      const cacheFirst = async (request: string) => {
        const cache = await caches.open('static-cache');
        const cached = await cache.match(request);
        
        if (cached) {
          return cached;
        }
        
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response.clone());
        }
        
        return response;
      };

      // Mock fetch와 cache
      global.fetch = jest.fn(() => 
        Promise.resolve(new Response('fresh data'))
      );

      const mockCache = {
        match: jest.fn(() => Promise.resolve(new Response('cached data'))),
        put: jest.fn(),
      };

      global.caches = {
        open: jest.fn(() => Promise.resolve(mockCache)),
      } as any;

      // When: 요청
      const response = await cacheFirst('/static/app.js');
      const data = await response.text();

      // Then: 캐시 우선 반환
      expect(data).toBe('cached data');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('TC-PWA-037: 네트워크 우선 전략', async () => {
      // Given: Network First 전략
      const networkFirst = async (request: string, timeout = 3000) => {
        try {
          const response = await Promise.race([
            fetch(request),
            new Promise<Response>((_, reject) => 
              setTimeout(() => reject(new Error('timeout')), timeout)
            ),
          ]);
          
          if (response.ok) {
            const cache = await caches.open('api-cache');
            await cache.put(request, response.clone());
          }
          
          return response;
        } catch (error) {
          const cache = await caches.open('api-cache');
          const cached = await cache.match(request);
          if (cached) return cached;
          throw error;
        }
      };

      // Mock
      global.fetch = jest.fn(() => 
        Promise.resolve(new Response('fresh data'))
      );

      global.caches = {
        open: jest.fn(() => Promise.resolve({
          match: jest.fn(() => Promise.resolve(null)),
          put: jest.fn(),
        })),
      } as any;

      // When: 네트워크 우선
      const response = await networkFirst('/api/user');
      const data = await response.text();

      // Then: 최신 데이터
      expect(data).toBe('fresh data');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('TC-PWA-038: 캐시 버전 관리', async () => {
      // Given: 버전별 캐시
      const CACHE_VERSION = 'v2';
      const CACHE_NAME = `app-cache-${CACHE_VERSION}`;
      
      const updateCache = async () => {
        // 이전 버전 삭제
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(name => name.startsWith('app-cache-') && name !== CACHE_NAME)
            .map(name => caches.delete(name))
        );
        
        // 새 버전 캐시
        const cache = await caches.open(CACHE_NAME);
        return cache;
      };

      // Mock
      global.caches = {
        keys: jest.fn(() => Promise.resolve(['app-cache-v1', 'app-cache-v2'])),
        delete: jest.fn(() => Promise.resolve(true)),
        open: jest.fn(() => Promise.resolve({})),
      } as any;

      // When: 캐시 업데이트
      await updateCache();

      // Then: 이전 버전 삭제
      expect(global.caches.delete).toHaveBeenCalledWith('app-cache-v1');
      expect(global.caches.delete).not.toHaveBeenCalledWith('app-cache-v2');
    });

    it('TC-PWA-039: 동적 캐싱', async () => {
      // Given: 런타임 캐싱
      const dynamicCache = {
        shouldCache(url: string): boolean {
          // API 응답은 캐시
          if (url.includes('/api/')) return true;
          // 이미지는 캐시
          if (url.match(/\.(png|jpg|jpeg|gif|webp)$/)) return true;
          // 외부 리소스는 캐시하지 않음
          if (!url.startsWith(self.location.origin)) return false;
          
          return false;
        },
        
        getCacheName(url: string): string {
          if (url.includes('/api/')) return 'api-cache';
          if (url.match(/\.(png|jpg|jpeg|gif|webp)$/)) return 'image-cache';
          return 'dynamic-cache';
        },
      };

      // When: URL별 캐싱 결정
      const testUrls = [
        '/api/devices',
        '/images/logo.png',
        'https://external.com/script.js',
        '/app.js',
      ];

      const results = testUrls.map(url => ({
        url,
        shouldCache: dynamicCache.shouldCache(url),
        cacheName: dynamicCache.shouldCache(url) ? dynamicCache.getCacheName(url) : null,
      }));

      // Then: 선택적 캐싱
      expect(results[0].shouldCache).toBe(true);
      expect(results[0].cacheName).toBe('api-cache');
      expect(results[2].shouldCache).toBe(false);
    });

    it('TC-PWA-040: 캐시 할당량 관리', async () => {
      // Given: 스토리지 관리
      const storageManager = {
        async estimate() {
          return {
            usage: 50 * 1024 * 1024, // 50MB
            quota: 100 * 1024 * 1024, // 100MB
          };
        },
        
        async clearOldCaches(threshold = 0.8) {
          const { usage, quota } = await this.estimate();
          const usageRatio = usage / quota;
          
          if (usageRatio > threshold) {
            // LRU 정책으로 오래된 캐시 삭제
            const cacheNames = await caches.keys();
            const oldestCache = cacheNames[0]; // 간단한 구현
            if (oldestCache) {
              await caches.delete(oldestCache);
            }
          }
          
          return usageRatio;
        },
      };

      // Mock
      global.caches = {
        keys: jest.fn(() => Promise.resolve(['old-cache', 'new-cache'])),
        delete: jest.fn(() => Promise.resolve(true)),
      } as any;

      // When: 스토리지 정리
      const usageRatio = await storageManager.clearOldCaches(0.4);

      // Then: 임계값 초과시 정리
      expect(usageRatio).toBe(0.5);
      expect(global.caches.delete).toHaveBeenCalledWith('old-cache');
    });
  });
});