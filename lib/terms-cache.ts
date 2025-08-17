'use client';

interface TermsData {
  id: string;
  type: string;
  title: string;
  content: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CacheEntry {
  data: TermsData | null;
  timestamp: number;
  expiresAt: number;
}

class TermsCache {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30분 캐시
  private readonly MAX_CACHE_SIZE = 10;

  private getCacheKey(type: string): string {
    return `terms_${type}`;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt;
  }

  private evictOldEntries(): void {
    if (this.cache.size <= this.MAX_CACHE_SIZE) return;

    // 가장 오래된 엔트리부터 제거
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    const toRemove = entries.slice(0, entries.length - this.MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => this.cache.delete(key));
  }

  get(type: string): TermsData | null {
    const key = this.getCacheKey(type);
    const entry = this.cache.get(key);

    if (!entry || this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(type: string, data: TermsData | null): void {
    const key = this.getCacheKey(type);
    const now = Date.now();
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION
    });

    this.evictOldEntries();
  }

  invalidate(type?: string): void {
    if (type) {
      this.cache.delete(this.getCacheKey(type));
    } else {
      this.cache.clear();
    }
  }

  // 프리로드 기능 - 자주 사용되는 약관을 미리 캐시
  async preload(types: string[] = ['terms_of_service', 'privacy_policy']): Promise<void> {
    const promises = types.map(async (type) => {
      if (this.get(type)) return; // 이미 캐시된 경우 스킵

      try {
        const response = await fetch(`/api/terms?type=${type}`);
        if (response.ok) {
          const result = await response.json();
          this.set(type, result.data);
        }
      } catch (error) {
        console.warn(`Failed to preload terms for ${type}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }
}

// 싱글톤 인스턴스
export const termsCache = new TermsCache();

// React 훅으로 캐시 사용
export function useTermsCache() {
  return {
    get: (type: string) => termsCache.get(type),
    set: (type: string, data: TermsData | null) => termsCache.set(type, data),
    invalidate: (type?: string) => termsCache.invalidate(type),
    preload: (types?: string[]) => termsCache.preload(types)
  };
}