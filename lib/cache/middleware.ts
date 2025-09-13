// 캐시 미들웨어 - API 응답 캐싱 자동화
import { NextRequest, NextResponse } from 'next/server';
import { globalCache } from './memory-cache';

export interface CacheConfig {
  ttl?: number;
  tags?: string[];
  keyGenerator?: (req: NextRequest) => string;
  shouldCache?: (req: NextRequest, res: NextResponse) => boolean;
  bypassCache?: (req: NextRequest) => boolean;
}

/**
 * API 응답 캐싱 미들웨어
 */
export function withCache(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: CacheConfig = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const {
      ttl = 5 * 60 * 1000, // 5분 기본
      tags = [],
      keyGenerator = defaultKeyGenerator,
      shouldCache = () => true,
      bypassCache = defaultBypassCheck
    } = config;

    // 캐시 우회 조건 확인
    if (bypassCache(req)) {
      console.log('🔄 [Cache Middleware] Bypassing cache');
      return await handler(req);
    }

    const cacheKey = keyGenerator(req);

    // 캐시에서 조회
    const cachedResponse = globalCache.get(cacheKey);
    if (cachedResponse) {
      console.log('🎯 [Cache Middleware] Cache hit:', cacheKey);
      return new NextResponse(JSON.stringify(cachedResponse), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT'
        }
      });
    }

    // 원본 핸들러 실행
    const response = await handler(req);

    // 캐싱 조건 확인
    if (response.ok && shouldCache(req, response)) {
      try {
        const responseData = await response.json();

        // 캐시에 저장
        globalCache.set(cacheKey, responseData, { ttl, tags });

        console.log('💾 [Cache Middleware] Cached response:', cacheKey);

        // 새로운 응답 객체 생성 (원본 response는 이미 consumed)
        return new NextResponse(JSON.stringify(responseData), {
          status: response.status,
          headers: {
            ...Object.fromEntries(response.headers.entries()),
            'X-Cache': 'MISS'
          }
        });
      } catch (error) {
        console.error('❌ [Cache Middleware] Failed to cache response:', error);
        return response;
      }
    }

    return response;
  };
}

/**
 * 기본 캐시 키 생성기
 */
function defaultKeyGenerator(req: NextRequest): string {
  const url = new URL(req.url);
  const method = req.method;
  const pathname = url.pathname;
  const searchParams = url.searchParams.toString();

  return `${method}:${pathname}${searchParams ? `?${searchParams}` : ''}`;
}

/**
 * 기본 캐시 우회 검사
 */
function defaultBypassCheck(req: NextRequest): boolean {
  const url = new URL(req.url);
  return (
    req.method !== 'GET' ||
    url.searchParams.has('no-cache') ||
    url.searchParams.get('no-cache') === 'true'
  );
}

/**
 * 태그 기반 캐시 무효화 헬퍼
 */
export function invalidateCache(tags: string[]): void {
  tags.forEach(tag => {
    globalCache.invalidateByTag(tag);
  });
}

/**
 * 패턴 기반 캐시 무효화 헬퍼
 */
export function invalidateCacheByPattern(pattern: RegExp): void {
  globalCache.invalidateByPattern(pattern);
}

/**
 * 특정 경로 캐시 무효화
 */
export function invalidateCacheByPath(path: string): void {
  const pattern = new RegExp(`GET:${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  globalCache.invalidateByPattern(pattern);
}

/**
 * 캐시 통계 조회
 */
export function getCacheStats() {
  return globalCache.getStats();
}

/**
 * 사전 정의된 캐시 설정들
 */
export const cacheConfigs = {
  // 기기 타입 목록 - 자주 변경되지 않음
  deviceTypes: {
    ttl: 10 * 60 * 1000, // 10분
    tags: ['device-types', 'admin']
  },

  // 카테고리 목록 - 거의 변경되지 않음
  categories: {
    ttl: 30 * 60 * 1000, // 30분
    tags: ['categories', 'admin']
  },

  // 개별 기기 목록 - 자주 변경될 수 있음
  devices: {
    ttl: 3 * 60 * 1000, // 3분
    tags: ['devices', 'admin']
  },

  // 공개 데이터 - 길게 캐시
  publicData: {
    ttl: 15 * 60 * 1000, // 15분
    tags: ['public']
  }
};