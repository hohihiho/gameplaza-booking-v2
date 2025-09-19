/**
 * 고급 푸시 알림 시스템
 * 세분화된 알림 관리 및 사용자 설정
 */

import { offlineManager } from './offline-manager';

// 알림 카테고리
export enum NotificationCategory {
  RESERVATION = 'reservation',
  CHECKIN = 'checkin',
  PROMOTION = 'promotion',
  SYSTEM = 'system',
  ANNOUNCEMENT = 'announcement',
  REMINDER = 'reminder'
}

// 알림 우선순위
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// 알림 설정
export interface NotificationPreferences {
  enabled: boolean;
  categories: {
    [key in NotificationCategory]: boolean;
  };
  quiet: {
    enabled: boolean;
    startTime: string; // "22:00"
    endTime: string;   // "08:00"
  };
  sound: boolean;
  vibration: boolean;
}

// 알림 페이로드
export interface NotificationPayload {
  id: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  actions?: NotificationAction[];
  data?: any;
  timestamp: number;
  expiresAt?: number;
}

// 알림 액션
export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// 알림 이력
export interface NotificationHistory {
  id: string;
  payload: NotificationPayload;
  deliveredAt: Date;
  interactedAt?: Date;
  action?: string;
  dismissed: boolean;
}

export class PushNotificationManager {
  private static instance: PushNotificationManager;
  private subscription: PushSubscription | null = null;
  private preferences: NotificationPreferences;
  private history: NotificationHistory[] = [];
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'gameplaza-notifications';
  private readonly DB_VERSION = 1;

  private constructor() {
    this.preferences = this.getDefaultPreferences();
    this.initialize();
  }

  static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }

  /**
   * 초기화
   */
  private async initialize() {
    if (typeof window === 'undefined') return;

    // IndexedDB 초기화
    await this.initializeDB();

    // 저장된 설정 로드
    await this.loadPreferences();

    // 저장된 이력 로드
    await this.loadHistory();

    // Service Worker 등록
    await this.registerServiceWorker();

    // 기존 구독 확인
    await this.checkExistingSubscription();

    console.log('[PushNotificationManager] 초기화 완료');
  }

  /**
   * IndexedDB 초기화
   */
  private initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 알림 이력 스토어
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id' });
          historyStore.createIndex('timestamp', 'deliveredAt');
          historyStore.createIndex('category', 'payload.category');
        }

        // 설정 스토어
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences');
        }

        // 예약 알림 스토어
        if (!db.objectStoreNames.contains('scheduled')) {
          const scheduledStore = db.createObjectStore('scheduled', { keyPath: 'id' });
          scheduledStore.createIndex('scheduledFor', 'scheduledFor');
        }
      };
    });
  }

  /**
   * Service Worker 등록
   */
  private async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PushNotificationManager] Service Worker 미지원');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw-advanced.js');
      console.log('[PushNotificationManager] Service Worker 등록 성공');
      return registration;
    } catch (error) {
      console.error('[PushNotificationManager] Service Worker 등록 실패:', error);
      return null;
    }
  }

  /**
   * 푸시 알림 구독
   */
  async subscribe(userId: string): Promise<boolean> {
    try {
      // 1. 권한 요청
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('[PushNotificationManager] 알림 권한 거부됨');
        return false;
      }

      // 2. Service Worker 준비
      const registration = await navigator.serviceWorker.ready;

      // 3. VAPID 키 가져오기
      const vapidPublicKey = await this.getVapidPublicKey();

      // 4. 푸시 구독
      this.subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });

      // 5. 서버에 구독 정보 저장
      await this.saveSubscriptionToServer(userId, this.subscription);

      // 6. 설정 업데이트
      this.preferences.enabled = true;
      await this.savePreferences();

      console.log('[PushNotificationManager] 푸시 알림 구독 성공');
      return true;

    } catch (error) {
      console.error('[PushNotificationManager] 푸시 알림 구독 실패:', error);
      return false;
    }
  }

  /**
   * 푸시 알림 구독 취소
   */
  async unsubscribe(userId: string): Promise<boolean> {
    try {
      if (!this.subscription) {
        const registration = await navigator.serviceWorker.ready;
        this.subscription = await registration.pushManager.getSubscription();
      }

      if (this.subscription) {
        await this.subscription.unsubscribe();
        await this.removeSubscriptionFromServer(userId);
        this.subscription = null;
      }

      this.preferences.enabled = false;
      await this.savePreferences();

      console.log('[PushNotificationManager] 푸시 알림 구독 취소 성공');
      return true;

    } catch (error) {
      console.error('[PushNotificationManager] 푸시 알림 구독 취소 실패:', error);
      return false;
    }
  }

  /**
   * 알림 권한 요청
   */
  private async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('[PushNotificationManager] 알림 API 미지원');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    return await Notification.requestPermission();
  }

  /**
   * 기존 구독 확인
   */
  private async checkExistingSubscription() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      this.subscription = await registration.pushManager.getSubscription();

      if (this.subscription) {
        console.log('[PushNotificationManager] 기존 구독 확인됨');
      }
    } catch (error) {
      console.error('[PushNotificationManager] 구독 확인 실패:', error);
    }
  }

  /**
   * 로컬 알림 표시
   */
  async showLocalNotification(payload: NotificationPayload): Promise<boolean> {
    // 방해 금지 시간 체크
    if (this.isQuietTime()) {
      console.log('[PushNotificationManager] 방해 금지 시간');
      return false;
    }

    // 카테고리 필터링
    if (!this.preferences.categories[payload.category]) {
      console.log('[PushNotificationManager] 카테고리 비활성화:', payload.category);
      return false;
    }

    // 알림 옵션 구성
    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-72x72.png',
      tag: payload.tag || payload.category,
      requireInteraction: payload.requireInteraction || payload.priority === NotificationPriority.URGENT,
      silent: payload.silent || !this.preferences.sound,
      vibrate: this.preferences.vibration ? [200, 100, 200] : undefined,
      data: payload.data,
      actions: payload.actions
    };

    if (payload.image) {
      (options as any).image = payload.image;
    }

    // Service Worker를 통해 알림 표시
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(payload.title, options);

    // 이력 저장
    await this.addToHistory(payload);

    return true;
  }

  /**
   * 알림 예약
   */
  async scheduleNotification(payload: NotificationPayload, scheduledFor: Date): Promise<string> {
    const id = `scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (!this.db) return id;

    const tx = this.db.transaction(['scheduled'], 'readwrite');
    const store = tx.objectStore('scheduled');

    await store.add({
      id,
      payload,
      scheduledFor: scheduledFor.getTime(),
      createdAt: Date.now()
    });

    // 백그라운드 동기화 등록
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('check-scheduled-notifications');
    }

    console.log('[PushNotificationManager] 알림 예약:', id, scheduledFor);
    return id;
  }

  /**
   * 예약된 알림 취소
   */
  async cancelScheduledNotification(id: string): Promise<boolean> {
    if (!this.db) return false;

    const tx = this.db.transaction(['scheduled'], 'readwrite');
    const store = tx.objectStore('scheduled');

    try {
      await store.delete(id);
      console.log('[PushNotificationManager] 예약 알림 취소:', id);
      return true;
    } catch (error) {
      console.error('[PushNotificationManager] 예약 알림 취소 실패:', error);
      return false;
    }
  }

  /**
   * 설정 업데이트
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>) {
    this.preferences = { ...this.preferences, ...preferences };
    await this.savePreferences();
  }

  /**
   * 카테고리별 설정
   */
  async setCategoryEnabled(category: NotificationCategory, enabled: boolean) {
    this.preferences.categories[category] = enabled;
    await this.savePreferences();
  }

  /**
   * 방해 금지 설정
   */
  async setQuietTime(enabled: boolean, startTime?: string, endTime?: string) {
    this.preferences.quiet = {
      enabled,
      startTime: startTime || this.preferences.quiet.startTime,
      endTime: endTime || this.preferences.quiet.endTime
    };
    await this.savePreferences();
  }

  /**
   * 방해 금지 시간 체크
   */
  private isQuietTime(): boolean {
    if (!this.preferences.quiet.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const { startTime, endTime } = this.preferences.quiet;

    // 자정을 넘는 경우 처리
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }

    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * 알림 이력 추가
   */
  private async addToHistory(payload: NotificationPayload) {
    const historyItem: NotificationHistory = {
      id: payload.id || `history-${Date.now()}`,
      payload,
      deliveredAt: new Date(),
      dismissed: false
    };

    this.history.unshift(historyItem);

    // 최대 100개까지만 유지
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100);
    }

    // DB에 저장
    if (this.db) {
      const tx = this.db.transaction(['history'], 'readwrite');
      const store = tx.objectStore('history');
      await store.add(historyItem);
    }
  }

  /**
   * 알림 이력 조회
   */
  getHistory(category?: NotificationCategory): NotificationHistory[] {
    if (category) {
      return this.history.filter(item => item.payload.category === category);
    }
    return this.history;
  }

  /**
   * 알림 이력 삭제
   */
  async clearHistory() {
    this.history = [];

    if (this.db) {
      const tx = this.db.transaction(['history'], 'readwrite');
      const store = tx.objectStore('history');
      await store.clear();
    }
  }

  /**
   * 설정 저장
   */
  private async savePreferences() {
    if (!this.db) return;

    const tx = this.db.transaction(['preferences'], 'readwrite');
    const store = tx.objectStore('preferences');
    await store.put(this.preferences, 'main');
  }

  /**
   * 설정 로드
   */
  private async loadPreferences() {
    if (!this.db) return;

    const tx = this.db.transaction(['preferences'], 'readonly');
    const store = tx.objectStore('preferences');
    const request = store.get('main');

    return new Promise<void>((resolve) => {
      request.onsuccess = () => {
        if (request.result) {
          this.preferences = request.result;
        }
        resolve();
      };

      request.onerror = () => resolve();
    });
  }

  /**
   * 이력 로드
   */
  private async loadHistory() {
    if (!this.db) return;

    const tx = this.db.transaction(['history'], 'readonly');
    const store = tx.objectStore('history');
    const index = store.index('timestamp');
    const request = index.openCursor(null, 'prev');

    return new Promise<void>((resolve) => {
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          this.history.push(cursor.value);
          if (this.history.length < 100) {
            cursor.continue();
          } else {
            resolve();
          }
        } else {
          resolve();
        }
      };

      request.onerror = () => resolve();
    });
  }

  /**
   * 기본 설정
   */
  private getDefaultPreferences(): NotificationPreferences {
    return {
      enabled: false,
      categories: {
        [NotificationCategory.RESERVATION]: true,
        [NotificationCategory.CHECKIN]: true,
        [NotificationCategory.PROMOTION]: true,
        [NotificationCategory.SYSTEM]: true,
        [NotificationCategory.ANNOUNCEMENT]: true,
        [NotificationCategory.REMINDER]: true
      },
      quiet: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00'
      },
      sound: true,
      vibration: true
    };
  }

  /**
   * VAPID 공개키 가져오기
   */
  private async getVapidPublicKey(): Promise<string> {
    // 환경 변수에서 가져오기
    if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    }

    // 서버에서 가져오기
    try {
      const response = await fetch('/api/notifications/vapid-key');
      const data = await response.json();
      return data.publicKey;
    } catch (error) {
      console.error('[PushNotificationManager] VAPID 키 가져오기 실패:', error);
      throw error;
    }
  }

  /**
   * 서버에 구독 정보 저장
   */
  private async saveSubscriptionToServer(userId: string, subscription: PushSubscription) {
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        subscription: subscription.toJSON()
      })
    });

    if (!response.ok) {
      throw new Error('구독 정보 서버 저장 실패');
    }
  }

  /**
   * 서버에서 구독 정보 삭제
   */
  private async removeSubscriptionFromServer(userId: string) {
    const response = await fetch('/api/notifications/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      throw new Error('구독 정보 서버 삭제 실패');
    }
  }

  /**
   * Base64 URL을 Uint8Array로 변환
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * 현재 설정 조회
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * 구독 상태 조회
   */
  isSubscribed(): boolean {
    return this.subscription !== null && this.preferences.enabled;
  }

  /**
   * 통계 조회
   */
  getStatistics() {
    const stats: Record<NotificationCategory, number> = {
      [NotificationCategory.RESERVATION]: 0,
      [NotificationCategory.CHECKIN]: 0,
      [NotificationCategory.PROMOTION]: 0,
      [NotificationCategory.SYSTEM]: 0,
      [NotificationCategory.ANNOUNCEMENT]: 0,
      [NotificationCategory.REMINDER]: 0
    };

    this.history.forEach(item => {
      stats[item.payload.category]++;
    });

    return {
      total: this.history.length,
      byCategory: stats,
      todayCount: this.history.filter(item => {
        const today = new Date();
        const delivered = new Date(item.deliveredAt);
        return delivered.toDateString() === today.toDateString();
      }).length
    };
  }
}

// 싱글톤 인스턴스
export const pushNotificationManager = PushNotificationManager.getInstance();

// 알림 템플릿
export const notificationTemplates = {
  // 예약 관련
  reservationCreated: (reservationNumber: string, deviceName: string, time: string): NotificationPayload => ({
    id: `reservation-created-${reservationNumber}`,
    category: NotificationCategory.RESERVATION,
    priority: NotificationPriority.NORMAL,
    title: '예약이 접수되었습니다',
    body: `${deviceName} ${time} 예약이 접수되었습니다. 관리자 승인을 기다려주세요.`,
    tag: 'reservation-created',
    data: { reservationNumber, deviceName, time },
    timestamp: Date.now()
  }),

  reservationApproved: (reservationNumber: string, deviceName: string, time: string): NotificationPayload => ({
    id: `reservation-approved-${reservationNumber}`,
    category: NotificationCategory.RESERVATION,
    priority: NotificationPriority.HIGH,
    title: '예약이 승인되었습니다! 🎉',
    body: `${deviceName} ${time} 예약이 승인되었습니다. 예약 시간에 방문해주세요.`,
    tag: 'reservation-approved',
    requireInteraction: true,
    actions: [
      { action: 'view', title: '예약 확인' },
      { action: 'calendar', title: '캘린더 추가' }
    ],
    data: { reservationNumber, deviceName, time },
    timestamp: Date.now()
  }),

  reservationReminder: (reservationNumber: string, deviceName: string, minutesLeft: number): NotificationPayload => ({
    id: `reservation-reminder-${reservationNumber}`,
    category: NotificationCategory.REMINDER,
    priority: NotificationPriority.URGENT,
    title: '🔔 예약 리마인더',
    body: minutesLeft >= 60
      ? `${Math.floor(minutesLeft / 60)}시간 후 ${deviceName} 예약이 있습니다.`
      : `${minutesLeft}분 후 ${deviceName} 예약이 있습니다.`,
    tag: 'reservation-reminder',
    requireInteraction: true,
    vibrate: [500, 100, 500],
    actions: [
      { action: 'checkin', title: '체크인' },
      { action: 'navigate', title: '길 안내' }
    ],
    data: { reservationNumber, deviceName, minutesLeft },
    timestamp: Date.now()
  }),

  // 체크인 관련
  checkinSuccess: (deviceName: string): NotificationPayload => ({
    id: `checkin-success-${Date.now()}`,
    category: NotificationCategory.CHECKIN,
    priority: NotificationPriority.NORMAL,
    title: '체크인 완료! ✅',
    body: `${deviceName} 체크인이 완료되었습니다. 즐거운 시간 되세요!`,
    tag: 'checkin-success',
    data: { deviceName },
    timestamp: Date.now()
  }),

  checkoutReminder: (deviceName: string, minutesLeft: number): NotificationPayload => ({
    id: `checkout-reminder-${Date.now()}`,
    category: NotificationCategory.REMINDER,
    priority: NotificationPriority.HIGH,
    title: '이용 시간 종료 임박',
    body: `${deviceName} 이용 시간이 ${minutesLeft}분 남았습니다.`,
    tag: 'checkout-reminder',
    requireInteraction: true,
    actions: [
      { action: 'extend', title: '연장하기' }
    ],
    data: { deviceName, minutesLeft },
    timestamp: Date.now()
  }),

  // 프로모션
  promotion: (title: string, description: string, imageUrl?: string): NotificationPayload => ({
    id: `promotion-${Date.now()}`,
    category: NotificationCategory.PROMOTION,
    priority: NotificationPriority.LOW,
    title,
    body: description,
    image: imageUrl,
    tag: 'promotion',
    actions: [
      { action: 'view', title: '자세히 보기' },
      { action: 'dismiss', title: '닫기' }
    ],
    data: { title, description },
    timestamp: Date.now()
  }),

  // 시스템
  systemUpdate: (message: string): NotificationPayload => ({
    id: `system-${Date.now()}`,
    category: NotificationCategory.SYSTEM,
    priority: NotificationPriority.NORMAL,
    title: '시스템 알림',
    body: message,
    tag: 'system',
    data: { message },
    timestamp: Date.now()
  }),

  // 공지사항
  announcement: (title: string, content: string): NotificationPayload => ({
    id: `announcement-${Date.now()}`,
    category: NotificationCategory.ANNOUNCEMENT,
    priority: NotificationPriority.HIGH,
    title: `📢 ${title}`,
    body: content,
    tag: 'announcement',
    requireInteraction: true,
    actions: [
      { action: 'read', title: '읽기' }
    ],
    data: { title, content },
    timestamp: Date.now()
  })
};