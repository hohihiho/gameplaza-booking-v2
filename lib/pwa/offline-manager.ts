/**
 * 오프라인 상태 관리자
 * 네트워크 연결 상태 감지 및 오프라인 기능 제공
 */

import { EventEmitter } from 'events';

export interface OfflineQueueItem {
  id: string;
  type: 'reservation' | 'checkin' | 'update' | 'delete';
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  data?: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface OfflineStatus {
  isOnline: boolean;
  lastOnline: Date | null;
  lastOffline: Date | null;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  queueSize: number;
}

export class OfflineManager extends EventEmitter {
  private static instance: OfflineManager;
  private isOnline: boolean = true;
  private lastOnline: Date | null = null;
  private lastOffline: Date | null = null;
  private queue: Map<string, OfflineQueueItem> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'gameplaza-offline';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'offline-queue';

  private constructor() {
    super();
    this.initialize();
  }

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  /**
   * 초기화
   */
  private async initialize() {
    // IndexedDB 초기화
    await this.initializeDB();

    // 온라인/오프라인 이벤트 리스너
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;

      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));

      // Network Information API 사용 가능시
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection.addEventListener('change', this.handleConnectionChange.bind(this));
      }

      // 주기적인 연결 체크
      this.startConnectionCheck();

      // 저장된 큐 항목 로드
      await this.loadQueueFromDB();

      console.log('[OfflineManager] 초기화 완료');
    }
  }

  /**
   * IndexedDB 초기화
   */
  private initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        resolve();
        return;
      }

      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('[OfflineManager] IndexedDB 열기 실패');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[OfflineManager] IndexedDB 연결 성공');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  /**
   * 온라인 상태 전환 핸들러
   */
  private async handleOnline() {
    console.log('[OfflineManager] 온라인 상태로 전환');
    this.isOnline = true;
    this.lastOnline = new Date();
    this.emit('online');

    // 대기 중인 요청 처리
    await this.processPendingQueue();

    // 서비스 워커에 동기화 요청
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('sync-reservations');
    }
  }

  /**
   * 오프라인 상태 전환 핸들러
   */
  private handleOffline() {
    console.log('[OfflineManager] 오프라인 상태로 전환');
    this.isOnline = false;
    this.lastOffline = new Date();
    this.emit('offline');

    // 사용자에게 알림
    this.showOfflineNotification();
  }

  /**
   * 네트워크 연결 변경 핸들러
   */
  private handleConnectionChange() {
    const connection = (navigator as any).connection;

    this.emit('connectionChange', {
      type: connection.type,
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    });

    // 느린 연결 감지
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      this.emit('slowConnection');
    }
  }

  /**
   * 주기적인 연결 체크
   */
  private startConnectionCheck() {
    setInterval(async () => {
      const isReallyOnline = await this.checkRealConnection();

      if (isReallyOnline !== this.isOnline) {
        if (isReallyOnline) {
          this.handleOnline();
        } else {
          this.handleOffline();
        }
      }
    }, 10000); // 10초마다 체크
  }

  /**
   * 실제 네트워크 연결 확인
   */
  private async checkRealConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 오프라인 알림 표시
   */
  private showOfflineNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('게임플라자 - 오프라인 모드', {
        body: '인터넷 연결이 끊어졌습니다. 일부 기능이 제한될 수 있습니다.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'offline-notification'
      });
    }
  }

  /**
   * 요청을 큐에 추가
   */
  async queueRequest(
    type: OfflineQueueItem['type'],
    method: OfflineQueueItem['method'],
    url: string,
    data?: any
  ): Promise<string> {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const queueItem: OfflineQueueItem = {
      id,
      type,
      method,
      url,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };

    this.queue.set(id, queueItem);

    // IndexedDB에 저장
    if (this.db) {
      const tx = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      await store.add(queueItem);
    }

    this.emit('queueUpdated', { size: this.queue.size });

    // 온라인이면 즉시 처리 시도
    if (this.isOnline) {
      await this.processQueueItem(id);
    }

    return id;
  }

  /**
   * 큐 항목 처리
   */
  private async processQueueItem(id: string): Promise<boolean> {
    const item = this.queue.get(id);
    if (!item) return false;

    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: item.data ? JSON.stringify(item.data) : undefined
      });

      if (response.ok) {
        // 성공시 큐에서 제거
        this.queue.delete(id);

        // IndexedDB에서 제거
        if (this.db) {
          const tx = this.db.transaction([this.STORE_NAME], 'readwrite');
          const store = tx.objectStore(this.STORE_NAME);
          await store.delete(id);
        }

        this.emit('queueProcessed', { id, success: true });
        return true;
      } else {
        // 실패시 재시도 카운트 증가
        item.retryCount++;

        if (item.retryCount >= item.maxRetries) {
          // 최대 재시도 횟수 초과
          this.queue.delete(id);
          this.emit('queueFailed', { id, error: 'Max retries exceeded' });
        }

        return false;
      }
    } catch (error) {
      // 네트워크 에러시 재시도 대기
      item.retryCount++;
      return false;
    }
  }

  /**
   * 대기 중인 큐 처리
   */
  async processPendingQueue() {
    const items = Array.from(this.queue.values()).sort((a, b) => a.timestamp - b.timestamp);

    for (const item of items) {
      await this.processQueueItem(item.id);
      // 요청 간 간격 두기
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * DB에서 큐 항목 로드
   */
  private async loadQueueFromDB() {
    if (!this.db) return;

    const tx = this.db.transaction([this.STORE_NAME], 'readonly');
    const store = tx.objectStore(this.STORE_NAME);
    const request = store.getAll();

    return new Promise<void>((resolve) => {
      request.onsuccess = () => {
        const items = request.result as OfflineQueueItem[];
        items.forEach(item => {
          this.queue.set(item.id, item);
        });
        console.log(`[OfflineManager] ${items.length}개 항목을 DB에서 로드`);
        resolve();
      };

      request.onerror = () => {
        console.error('[OfflineManager] DB 로드 실패');
        resolve();
      };
    });
  }

  /**
   * 현재 상태 조회
   */
  getStatus(): OfflineStatus {
    const connection = 'connection' in navigator ? (navigator as any).connection : null;

    return {
      isOnline: this.isOnline,
      lastOnline: this.lastOnline,
      lastOffline: this.lastOffline,
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      queueSize: this.queue.size
    };
  }

  /**
   * 큐 상태 조회
   */
  getQueueStatus() {
    return {
      size: this.queue.size,
      items: Array.from(this.queue.values()).map(item => ({
        id: item.id,
        type: item.type,
        url: item.url,
        timestamp: new Date(item.timestamp).toISOString(),
        retryCount: item.retryCount
      }))
    };
  }

  /**
   * 큐 초기화
   */
  async clearQueue() {
    this.queue.clear();

    if (this.db) {
      const tx = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      await store.clear();
    }

    this.emit('queueCleared');
  }

  /**
   * 오프라인 데이터 캐싱
   */
  async cacheOfflineData(key: string, data: any) {
    if (!this.db) return;

    const cacheStore = 'offline-cache';
    const tx = this.db.transaction([cacheStore], 'readwrite');
    const store = tx.objectStore(cacheStore);

    await store.put({
      key,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 오프라인 캐시 조회
   */
  async getCachedData(key: string): Promise<any> {
    if (!this.db) return null;

    const cacheStore = 'offline-cache';
    const tx = this.db.transaction([cacheStore], 'readonly');
    const store = tx.objectStore(cacheStore);
    const request = store.get(key);

    return new Promise((resolve) => {
      request.onsuccess = () => {
        resolve(request.result?.data || null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  }

  /**
   * 클린업
   */
  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline.bind(this));
      window.removeEventListener('offline', this.handleOffline.bind(this));
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    if (this.db) {
      this.db.close();
    }

    this.removeAllListeners();
  }
}

// 싱글톤 인스턴스
export const offlineManager = OfflineManager.getInstance();