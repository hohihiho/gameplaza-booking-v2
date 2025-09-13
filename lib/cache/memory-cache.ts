// 개선된 메모리 캐시 시스템
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  tags?: string[];
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[];
}

export class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    this.defaultTTL = defaultTTL;
    this.startCleanup();
  }

  /**
   * 캐시에 데이터 저장
   */
  set<T>(key: string, data: T, options?: CacheOptions): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: options?.ttl || this.defaultTTL,
      tags: options?.tags || []
    };

    this.cache.set(key, entry);

    // 개발 환경에서는 캐시 저장 로그
    if (process.env.NODE_ENV === 'development') {
      console.log(`📦 [Cache] Stored: ${key} (TTL: ${entry.ttl}ms, Tags: ${entry.tags?.join(', ') || 'none'})`);
    }
  }

  /**
   * 캐시에서 데이터 조회
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const isExpired = (now - entry.timestamp) > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏰ [Cache] Expired and removed: ${key}`);
      }
      return null;
    }

    if (process.env.NODE_ENV === 'development') {
      const remainingTime = entry.ttl - (now - entry.timestamp);
      console.log(`✅ [Cache] Hit: ${key} (${Math.round(remainingTime / 1000)}s remaining)`);
    }

    return entry.data;
  }

  /**
   * 특정 키의 캐시 삭제
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (result && process.env.NODE_ENV === 'development') {
      console.log(`🗑️ [Cache] Deleted: ${key}`);
    }
    return result;
  }

  /**
   * 태그로 캐시 무효화
   */
  invalidateByTag(tag: string): number {
    let invalidated = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags?.includes(tag)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    if (process.env.NODE_ENV === 'development' && invalidated > 0) {
      console.log(`🔄 [Cache] Invalidated ${invalidated} entries with tag: ${tag}`);
    }

    return invalidated;
  }

  /**
   * 키 패턴으로 캐시 무효화
   */
  invalidateByPattern(pattern: RegExp): number {
    let invalidated = 0;

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    if (process.env.NODE_ENV === 'development' && invalidated > 0) {
      console.log(`🔄 [Cache] Invalidated ${invalidated} entries matching pattern: ${pattern}`);
    }

    return invalidated;
  }

  /**
   * 전체 캐시 삭제
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();

    if (process.env.NODE_ENV === 'development') {
      console.log(`🧹 [Cache] Cleared all ${size} entries`);
    }
  }

  /**
   * 캐시 통계 조회
   */
  getStats() {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();

    const validEntries = entries.filter(([, entry]) =>
      (now - entry.timestamp) <= entry.ttl
    );

    return {
      total: this.cache.size,
      valid: validEntries.length,
      expired: this.cache.size - validEntries.length,
      memoryUsage: JSON.stringify(entries).length // 대략적인 메모리 사용량
    };
  }

  /**
   * 만료된 항목 정리
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      const isExpired = (now - entry.timestamp) > entry.ttl;
      if (isExpired) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (process.env.NODE_ENV === 'development' && cleaned > 0) {
      console.log(`🧹 [Cache] Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * 정기적 정리 작업 시작
   */
  private startCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // 5분마다 정리
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * 정리 작업 중단
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// 전역 캐시 인스턴스
export const globalCache = new MemoryCache();

// 프로세스 종료 시 정리
process.on('SIGTERM', () => globalCache.destroy());
process.on('SIGINT', () => globalCache.destroy());