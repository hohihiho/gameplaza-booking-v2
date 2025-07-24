/**
 * 성능 모니터링 유틸리티
 * 
 * 클라이언트 사이드에서 API 성능을 모니터링하고
 * 서버로 메트릭을 전송합니다.
 */

interface PerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: string;
  apiVersion: string;
  canary: boolean;
  error?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private batchSize = 10;
  private flushInterval = 30000; // 30초
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.startBatchTimer();
      
      // 페이지 언로드 시 메트릭 전송
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  /**
   * API 호출 성능 측정
   */
  async measureApiCall<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const startTime = performance.now();
    const method = options.method || 'GET';
    let status = 0;
    let error: string | undefined;
    let apiVersion = 'v1';
    let canary = false;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'x-request-start': startTime.toString(),
        },
      });

      status = response.status;
      
      // API 버전 및 canary 정보 추출
      apiVersion = response.headers.get('x-api-version') || 'v1';
      canary = response.headers.get('x-canary') === 'true';

      // 에러 응답 처리
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        error = errorData.error || `HTTP ${status}`;
      }

      return response;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      const duration = performance.now() - startTime;
      
      // 메트릭 기록
      this.recordMetric({
        endpoint: new URL(url, window.location.origin).pathname,
        method,
        duration,
        status,
        timestamp: new Date().toISOString(),
        apiVersion,
        canary,
        error,
      });
    }
  }

  /**
   * 메트릭 기록
   */
  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // 배치 크기 도달 시 즉시 전송
    if (this.metrics.length >= this.batchSize) {
      this.flush();
    }

    // 성능 임계값 초과 시 경고
    if (metric.duration > 1000) {
      console.warn(`Slow API call detected: ${metric.endpoint} took ${metric.duration}ms`);
    }

    // 에러 발생 시 즉시 보고
    if (metric.error && metric.status >= 500) {
      this.reportError(metric);
    }
  }

  /**
   * 배치 타이머 시작
   */
  private startBatchTimer() {
    this.timer = setInterval(() => {
      if (this.metrics.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  /**
   * 메트릭 전송
   */
  private async flush() {
    if (this.metrics.length === 0) return;

    const metricsToSend = [...this.metrics];
    this.metrics = [];

    try {
      // 메트릭 집계
      const aggregated = this.aggregateMetrics(metricsToSend);

      // 서버로 전송
      await fetch('/api/v2/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'client-metrics',
          metrics: aggregated,
          raw: metricsToSend.slice(-5), // 최근 5개 원시 데이터
        }),
      });
    } catch (error) {
      console.error('Failed to send metrics:', error);
      // 실패한 메트릭은 다시 큐에 추가
      this.metrics.unshift(...metricsToSend.slice(0, 5));
    }
  }

  /**
   * 메트릭 집계
   */
  private aggregateMetrics(metrics: PerformanceMetric[]) {
    const grouped = metrics.reduce((acc, metric) => {
      const key = `${metric.endpoint}:${metric.method}:${metric.apiVersion}`;
      
      if (!acc[key]) {
        acc[key] = {
          endpoint: metric.endpoint,
          method: metric.method,
          apiVersion: metric.apiVersion,
          count: 0,
          totalDuration: 0,
          maxDuration: 0,
          minDuration: Infinity,
          errors: 0,
          statuses: {} as Record<number, number>,
          canaryCount: 0,
        };
      }

      const group = acc[key];
      group.count++;
      group.totalDuration += metric.duration;
      group.maxDuration = Math.max(group.maxDuration, metric.duration);
      group.minDuration = Math.min(group.minDuration, metric.duration);
      
      if (metric.error) group.errors++;
      if (metric.canary) group.canaryCount++;
      
      group.statuses[metric.status] = (group.statuses[metric.status] || 0) + 1;

      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).map(group => ({
      ...group,
      avgDuration: group.totalDuration / group.count,
      errorRate: (group.errors / group.count) * 100,
      canaryRate: (group.canaryCount / group.count) * 100,
    }));
  }

  /**
   * 에러 즉시 보고
   */
  private async reportError(metric: PerformanceMetric) {
    try {
      await fetch('/api/v2/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'error',
          error: metric.error,
          path: metric.endpoint,
          responseTime: metric.duration,
          apiVersion: metric.apiVersion,
          canary: metric.canary,
        }),
      });
    } catch (error) {
      console.error('Failed to report error:', error);
    }
  }

  /**
   * 현재 메트릭 조회
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * 정리
   */
  destroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.flush();
  }
}

// 싱글톤 인스턴스
let performanceMonitor: PerformanceMonitor | null = null;

/**
 * PerformanceMonitor 인스턴스 가져오기
 */
export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitor && typeof window !== 'undefined') {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor!;
}

/**
 * 성능 모니터링이 적용된 fetch 함수
 */
export async function monitoredFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const monitor = getPerformanceMonitor();
  
  if (monitor) {
    return monitor.measureApiCall(url, options);
  }
  
  // 모니터링 불가능한 환경에서는 일반 fetch
  return fetch(url, options);
}

/**
 * React Hook: 성능 메트릭 조회
 */
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);

  useEffect(() => {
    const monitor = getPerformanceMonitor();
    
    if (!monitor) return;

    // 초기 메트릭 설정
    setMetrics(monitor.getMetrics());

    // 주기적으로 업데이트
    const interval = setInterval(() => {
      setMetrics(monitor.getMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
}

/**
 * 성능 통계 계산
 */
export function calculatePerformanceStats(metrics: PerformanceMetric[]) {
  if (metrics.length === 0) {
    return {
      avgDuration: 0,
      p95Duration: 0,
      p99Duration: 0,
      errorRate: 0,
      totalRequests: 0,
    };
  }

  const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
  const errors = metrics.filter(m => m.error).length;

  return {
    avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
    p95Duration: durations[Math.floor(durations.length * 0.95)] || 0,
    p99Duration: durations[Math.floor(durations.length * 0.99)] || 0,
    errorRate: (errors / metrics.length) * 100,
    totalRequests: metrics.length,
  };
}

// useState import
import { useState, useEffect } from 'react';