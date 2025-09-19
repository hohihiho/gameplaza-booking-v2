/**
 * 데이터베이스 쿼리 최적화 유틸리티
 * Cloudflare D1용 최적화 전략
 */

import { D1Database } from '@cloudflare/workers-types';

export interface QueryMetrics {
  query: string;
  executionTime: number;
  rowsAffected: number;
  timestamp: number;
}

export interface OptimizationHint {
  type: 'index' | 'query_rewrite' | 'batch' | 'cache';
  description: string;
  impact: 'low' | 'medium' | 'high';
}

export class QueryOptimizer {
  private static instance: QueryOptimizer;
  private queryMetrics: Map<string, QueryMetrics[]> = new Map();
  private slowQueryThreshold = 100; // 100ms
  private cacheMap: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 60000; // 60초

  private constructor() {}

  static getInstance(): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      QueryOptimizer.instance = new QueryOptimizer();
    }
    return QueryOptimizer.instance;
  }

  /**
   * 쿼리 실행 및 메트릭 수집
   */
  async executeWithMetrics<T>(
    db: D1Database,
    query: string,
    params?: any[]
  ): Promise<{ result: T; metrics: QueryMetrics }> {
    const startTime = performance.now();

    try {
      const stmt = params ? db.prepare(query).bind(...params) : db.prepare(query);
      const result = await stmt.all() as T;

      const executionTime = performance.now() - startTime;
      const metrics: QueryMetrics = {
        query,
        executionTime,
        rowsAffected: (result as any).meta?.changes || 0,
        timestamp: Date.now()
      };

      // 메트릭 저장
      this.recordMetrics(query, metrics);

      // 슬로우 쿼리 감지
      if (executionTime > this.slowQueryThreshold) {
        console.warn('[SlowQuery]', {
          query,
          executionTime: `${executionTime.toFixed(2)}ms`,
          hints: this.getOptimizationHints(query, metrics)
        });
      }

      return { result, metrics };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      console.error('[QueryError]', { query, executionTime, error });
      throw error;
    }
  }

  /**
   * 배치 쿼리 실행 최적화
   */
  async executeBatch<T>(
    db: D1Database,
    queries: Array<{ query: string; params?: any[] }>
  ): Promise<T[]> {
    const batch = queries.map(({ query, params }) =>
      params ? db.prepare(query).bind(...params) : db.prepare(query)
    );

    const startTime = performance.now();
    const results = await db.batch(batch);
    const executionTime = performance.now() - startTime;

    console.log(`[BatchQuery] ${queries.length}개 쿼리 실행: ${executionTime.toFixed(2)}ms`);

    return results as T[];
  }

  /**
   * 캐시를 활용한 쿼리 최적화
   */
  async executeWithCache<T>(
    db: D1Database,
    cacheKey: string,
    query: string,
    params?: any[],
    ttl?: number
  ): Promise<T> {
    // 캐시 확인
    const cached = this.getCache(cacheKey);
    if (cached) {
      console.log('[CacheHit]', cacheKey);
      return cached;
    }

    // 쿼리 실행
    const { result } = await this.executeWithMetrics<T>(db, query, params);

    // 캐시 저장
    this.setCache(cacheKey, result, ttl || this.cacheTimeout);

    return result;
  }

  /**
   * 인덱스 힌트 생성
   */
  getIndexHints(tableName: string): string[] {
    const hints: string[] = [];

    // 예약 테이블 인덱스
    if (tableName === 'reservations') {
      hints.push('CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);');
      hints.push('CREATE INDEX IF NOT EXISTS idx_reservations_date_status ON reservations(date, status);');
      hints.push('CREATE INDEX IF NOT EXISTS idx_reservations_device_date ON reservations(device_id, date);');
      hints.push('CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at);');
    }

    // 기기 테이블 인덱스
    if (tableName === 'devices') {
      hints.push('CREATE INDEX IF NOT EXISTS idx_devices_category ON devices(category);');
      hints.push('CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);');
      hints.push('CREATE INDEX IF NOT EXISTS idx_devices_display_order ON devices(display_order);');
    }

    // 사용자 테이블 인덱스
    if (tableName === 'users') {
      hints.push('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
      hints.push('CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);');
      hints.push('CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);');
    }

    // 체크인 테이블 인덱스
    if (tableName === 'checkins') {
      hints.push('CREATE INDEX IF NOT EXISTS idx_checkins_reservation_id ON checkins(reservation_id);');
      hints.push('CREATE INDEX IF NOT EXISTS idx_checkins_status ON checkins(status);');
      hints.push('CREATE INDEX IF NOT EXISTS idx_checkins_checkin_time ON checkins(checkin_time);');
    }

    return hints;
  }

  /**
   * 쿼리 리라이트 최적화
   */
  optimizeQuery(query: string): string {
    let optimized = query;

    // SELECT * 제거
    if (optimized.includes('SELECT *')) {
      console.warn('[QueryOptimizer] SELECT * 사용 감지 - 필요한 컬럼만 선택하세요');
    }

    // N+1 쿼리 패턴 감지
    if (this.detectNPlusOnePattern(query)) {
      console.warn('[QueryOptimizer] N+1 쿼리 패턴 감지 - JOIN 사용을 고려하세요');
    }

    // LIMIT 없는 쿼리
    if (query.toLowerCase().includes('select') &&
        !query.toLowerCase().includes('limit') &&
        !query.toLowerCase().includes('count(')) {
      console.warn('[QueryOptimizer] LIMIT 없는 SELECT 쿼리 - 페이지네이션을 고려하세요');
    }

    // OR 조건 최적화
    if (query.includes(' OR ')) {
      console.warn('[QueryOptimizer] OR 조건 사용 - UNION 또는 IN 절 사용을 고려하세요');
    }

    return optimized;
  }

  /**
   * 예약 관련 최적화된 쿼리
   */
  getOptimizedReservationQueries() {
    return {
      // 날짜별 예약 조회 (인덱스 활용)
      getByDate: `
        SELECT r.*, d.name as device_name, d.category, u.name as user_name
        FROM reservations r
        JOIN devices d ON r.device_id = d.id
        JOIN users u ON r.user_id = u.id
        WHERE r.date = ? AND r.status IN ('pending', 'approved')
        ORDER BY r.start_time
        LIMIT ?
      `,

      // 사용자별 최근 예약 (인덱스 + 제한)
      getUserRecent: `
        SELECT r.*, d.name as device_name
        FROM reservations r
        JOIN devices d ON r.device_id = d.id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
        LIMIT 10
      `,

      // 기기별 예약 상태 (효율적인 집계)
      getDeviceStats: `
        SELECT
          device_id,
          COUNT(*) as total_reservations,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
        FROM reservations
        WHERE date BETWEEN ? AND ?
        GROUP BY device_id
      `,

      // 시간대별 예약 현황 (윈도우 함수 대체)
      getTimeSlotStatus: `
        WITH time_slots AS (
          SELECT DISTINCT start_time, end_time
          FROM reservations
          WHERE date = ?
        )
        SELECT
          ts.*,
          (SELECT COUNT(*) FROM reservations r
           WHERE r.date = ? AND r.start_time = ts.start_time) as reservation_count
        FROM time_slots ts
        ORDER BY ts.start_time
      `
    };
  }

  /**
   * 메트릭 기록
   */
  private recordMetrics(query: string, metrics: QueryMetrics) {
    const queryKey = this.normalizeQuery(query);

    if (!this.queryMetrics.has(queryKey)) {
      this.queryMetrics.set(queryKey, []);
    }

    const metricsList = this.queryMetrics.get(queryKey)!;
    metricsList.push(metrics);

    // 최대 100개까지만 보관
    if (metricsList.length > 100) {
      metricsList.shift();
    }
  }

  /**
   * 최적화 힌트 생성
   */
  private getOptimizationHints(query: string, metrics: QueryMetrics): OptimizationHint[] {
    const hints: OptimizationHint[] = [];

    // 슬로우 쿼리
    if (metrics.executionTime > this.slowQueryThreshold) {
      hints.push({
        type: 'index',
        description: '인덱스 추가를 고려하세요',
        impact: 'high'
      });
    }

    // SELECT * 사용
    if (query.includes('SELECT *')) {
      hints.push({
        type: 'query_rewrite',
        description: '필요한 컬럼만 선택하세요',
        impact: 'medium'
      });
    }

    // 반복 쿼리
    const queryKey = this.normalizeQuery(query);
    const queryHistory = this.queryMetrics.get(queryKey) || [];
    if (queryHistory.length > 10) {
      hints.push({
        type: 'cache',
        description: '자주 실행되는 쿼리입니다. 캐싱을 고려하세요',
        impact: 'high'
      });
    }

    // 대량 데이터
    if (metrics.rowsAffected > 100) {
      hints.push({
        type: 'batch',
        description: '페이지네이션 또는 배치 처리를 고려하세요',
        impact: 'medium'
      });
    }

    return hints;
  }

  /**
   * N+1 패턴 감지
   */
  private detectNPlusOnePattern(query: string): boolean {
    const queryKey = this.normalizeQuery(query);
    const history = this.queryMetrics.get(queryKey) || [];

    // 최근 10초 내에 같은 패턴의 쿼리가 5번 이상 실행
    const recentQueries = history.filter(m =>
      Date.now() - m.timestamp < 10000
    );

    return recentQueries.length > 5;
  }

  /**
   * 쿼리 정규화
   */
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\?/g, 'PARAM')
      .trim();
  }

  /**
   * 캐시 조회
   */
  private getCache(key: string): any {
    const cached = this.cacheMap.get(key);

    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cacheMap.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * 캐시 저장
   */
  private setCache(key: string, data: any, ttl: number) {
    this.cacheMap.set(key, {
      data,
      timestamp: Date.now()
    });

    // 자동 삭제
    setTimeout(() => {
      this.cacheMap.delete(key);
    }, ttl);
  }

  /**
   * 쿼리 통계 조회
   */
  getQueryStats() {
    const stats: any[] = [];

    this.queryMetrics.forEach((metrics, query) => {
      const times = metrics.map(m => m.executionTime);
      const average = times.reduce((a, b) => a + b, 0) / times.length;
      const max = Math.max(...times);
      const min = Math.min(...times);

      stats.push({
        query,
        count: metrics.length,
        averageTime: average.toFixed(2),
        maxTime: max.toFixed(2),
        minTime: min.toFixed(2),
        lastExecuted: new Date(metrics[metrics.length - 1].timestamp).toISOString()
      });
    });

    return stats.sort((a, b) => b.count - a.count);
  }

  /**
   * 캐시 통계
   */
  getCacheStats() {
    return {
      size: this.cacheMap.size,
      keys: Array.from(this.cacheMap.keys()),
      memoryUsage: this.estimateCacheMemory()
    };
  }

  /**
   * 캐시 메모리 추정
   */
  private estimateCacheMemory(): string {
    let totalSize = 0;

    this.cacheMap.forEach((value) => {
      totalSize += JSON.stringify(value).length;
    });

    if (totalSize < 1024) return `${totalSize} B`;
    if (totalSize < 1024 * 1024) return `${(totalSize / 1024).toFixed(2)} KB`;
    return `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;
  }

  /**
   * 캐시 클리어
   */
  clearCache() {
    this.cacheMap.clear();
  }

  /**
   * 메트릭 리셋
   */
  resetMetrics() {
    this.queryMetrics.clear();
  }
}

// 싱글톤 인스턴스
export const queryOptimizer = QueryOptimizer.getInstance();