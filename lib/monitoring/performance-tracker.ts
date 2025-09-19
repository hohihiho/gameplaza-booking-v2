/**
 * 고급 성능 메트릭 수집기
 *
 * 기존 performance.ts를 확장하여 더 상세한 메트릭 수집
 * - Core Web Vitals (LCP, FID, CLS, FCP, TTFB)
 * - 리소스 타이밍
 * - 네비게이션 타이밍
 * - 사용자 인터랙션 추적
 */

import { getPerformanceMonitor } from './performance';

// Core Web Vitals 타입 정의
interface CoreWebVitals {
  LCP?: number;  // Largest Contentful Paint
  FID?: number;  // First Input Delay
  CLS?: number;  // Cumulative Layout Shift
  FCP?: number;  // First Contentful Paint
  TTFB?: number; // Time to First Byte
  INP?: number;  // Interaction to Next Paint
}

// 리소스 타이밍 정보
interface ResourceTiming {
  name: string;
  type: string;
  duration: number;
  size: number;
  startTime: number;
}

// 네비게이션 타이밍 정보
interface NavigationTiming {
  domContentLoaded: number;
  loadComplete: number;
  redirectTime: number;
  dnsTime: number;
  tcpTime: number;
  requestTime: number;
  responseTime: number;
}

// 통합 메트릭 데이터
export interface PerformanceData {
  timestamp: string;
  url: string;
  userAgent: string;
  connection?: {
    effectiveType: string;
    rtt: number;
    downlink: number;
    saveData: boolean;
  };
  webVitals: CoreWebVitals;
  navigation: NavigationTiming;
  resources: ResourceTiming[];
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  deviceInfo: {
    screenResolution: string;
    viewport: string;
    devicePixelRatio: number;
  };
}

export class PerformanceTracker {
  private webVitals: CoreWebVitals = {};
  private resourceBuffer: ResourceTiming[] = [];
  private observer: PerformanceObserver | null = null;
  private reportCallback: ((data: PerformanceData) => void) | null = null;
  private reportThreshold = 5000; // 5초마다 리포트
  private lastReportTime = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
      this.trackWebVitals();
      this.trackResources();
      this.startReporting();
    }
  }

  /**
   * PerformanceObserver 초기화
   */
  private initializeObservers() {
    try {
      // LCP 추적
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.webVitals.LCP = lastEntry.renderTime || lastEntry.loadTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // FID 추적
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        entries.forEach((entry) => {
          if (entry.name === 'first-input') {
            this.webVitals.FID = entry.processingStart - entry.startTime;
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // CLS 추적
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.webVitals.CLS = clsValue;
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // FCP 추적
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.webVitals.FCP = entry.startTime;
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }

  /**
   * Web Vitals 추적
   */
  private trackWebVitals() {
    // TTFB 계산
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      this.webVitals.TTFB = timing.responseStart - timing.navigationStart;
    }

    // INP 추적 (Interaction to Next Paint)
    if ('PerformanceEventTiming' in window) {
      let maxDuration = 0;
      const inpObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.duration > maxDuration) {
            maxDuration = entry.duration;
            this.webVitals.INP = maxDuration;
          }
        });
      });

      try {
        inpObserver.observe({ entryTypes: ['event'], buffered: true });
      } catch (e) {
        // INP not supported
      }
    }
  }

  /**
   * 리소스 로딩 추적
   */
  private trackResources() {
    if (!window.performance || !window.performance.getEntriesByType) return;

    const resourceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry: any) => {
        if (entry.entryType === 'resource') {
          this.resourceBuffer.push({
            name: entry.name,
            type: entry.initiatorType,
            duration: entry.duration,
            size: entry.transferSize || 0,
            startTime: entry.startTime,
          });

          // 버퍼 크기 제한
          if (this.resourceBuffer.length > 100) {
            this.resourceBuffer.shift();
          }
        }
      });
    });

    try {
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (e) {
      // Resource timing not supported
    }
  }

  /**
   * 네비게이션 타이밍 수집
   */
  private getNavigationTiming(): NavigationTiming {
    const timing = window.performance.timing;

    return {
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      loadComplete: timing.loadEventEnd - timing.navigationStart,
      redirectTime: timing.redirectEnd - timing.redirectStart,
      dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
      tcpTime: timing.connectEnd - timing.connectStart,
      requestTime: timing.responseStart - timing.requestStart,
      responseTime: timing.responseEnd - timing.responseStart,
    };
  }

  /**
   * 네트워크 정보 수집
   */
  private getConnectionInfo() {
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

    if (connection) {
      return {
        effectiveType: connection.effectiveType || 'unknown',
        rtt: connection.rtt || 0,
        downlink: connection.downlink || 0,
        saveData: connection.saveData || false,
      };
    }

    return undefined;
  }

  /**
   * 메모리 정보 수집
   */
  private getMemoryInfo() {
    const perf = performance as any;

    if (perf.memory) {
      return {
        usedJSHeapSize: perf.memory.usedJSHeapSize,
        totalJSHeapSize: perf.memory.totalJSHeapSize,
        jsHeapSizeLimit: perf.memory.jsHeapSizeLimit,
      };
    }

    return undefined;
  }

  /**
   * 디바이스 정보 수집
   */
  private getDeviceInfo() {
    return {
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio || 1,
    };
  }

  /**
   * 전체 성능 데이터 수집
   */
  public collectPerformanceData(): PerformanceData {
    return {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connection: this.getConnectionInfo(),
      webVitals: { ...this.webVitals },
      navigation: this.getNavigationTiming(),
      resources: [...this.resourceBuffer.slice(-20)], // 최근 20개 리소스
      memory: this.getMemoryInfo(),
      deviceInfo: this.getDeviceInfo(),
    };
  }

  /**
   * 자동 리포팅 시작
   */
  private startReporting() {
    // 페이지 로드 완료 후 초기 리포트
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.report();
      }, 2000); // 2초 후 초기 리포트
    });

    // 주기적 리포트
    setInterval(() => {
      const now = Date.now();
      if (now - this.lastReportTime > this.reportThreshold) {
        this.report();
        this.lastReportTime = now;
      }
    }, this.reportThreshold);

    // 페이지 언로드 시 최종 리포트
    window.addEventListener('beforeunload', () => {
      this.report();
    });

    // 가시성 변경 시 리포트
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.report();
      }
    });
  }

  /**
   * 성능 데이터 리포트
   */
  private async report() {
    const data = this.collectPerformanceData();

    // 커스텀 콜백 실행
    if (this.reportCallback) {
      this.reportCallback(data);
    }

    // 서버로 전송
    try {
      await fetch('/api/monitoring/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        keepalive: true, // 페이지 언로드 시에도 전송
      });
    } catch (error) {
      console.error('Failed to report performance metrics:', error);
    }
  }

  /**
   * 리포트 콜백 설정
   */
  public onReport(callback: (data: PerformanceData) => void) {
    this.reportCallback = callback;
  }

  /**
   * 수동 리포트 트리거
   */
  public triggerReport() {
    this.report();
  }

  /**
   * Web Vitals 스코어 계산
   */
  public getWebVitalsScore(): { score: number; rating: 'good' | 'needs-improvement' | 'poor' } {
    const { LCP, FID, CLS } = this.webVitals;

    let score = 100;
    let issues = 0;

    // LCP 평가 (2.5s good, 4s poor)
    if (LCP) {
      if (LCP > 4000) {
        score -= 30;
        issues++;
      } else if (LCP > 2500) {
        score -= 15;
      }
    }

    // FID 평가 (100ms good, 300ms poor)
    if (FID) {
      if (FID > 300) {
        score -= 30;
        issues++;
      } else if (FID > 100) {
        score -= 15;
      }
    }

    // CLS 평가 (0.1 good, 0.25 poor)
    if (CLS) {
      if (CLS > 0.25) {
        score -= 30;
        issues++;
      } else if (CLS > 0.1) {
        score -= 15;
      }
    }

    let rating: 'good' | 'needs-improvement' | 'poor';
    if (score >= 90) {
      rating = 'good';
    } else if (score >= 50) {
      rating = 'needs-improvement';
    } else {
      rating = 'poor';
    }

    return { score, rating };
  }

  /**
   * 정리
   */
  public destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // 마지막 리포트
    this.report();
  }
}

// 싱글톤 인스턴스
let tracker: PerformanceTracker | null = null;

/**
 * PerformanceTracker 인스턴스 가져오기
 */
export function getPerformanceTracker(): PerformanceTracker {
  if (!tracker && typeof window !== 'undefined') {
    tracker = new PerformanceTracker();
  }
  return tracker!;
}

/**
 * React Hook: 실시간 Web Vitals
 */
export function useWebVitals() {
  const [vitals, setVitals] = useState<CoreWebVitals>({});
  const [score, setScore] = useState<{ score: number; rating: 'good' | 'needs-improvement' | 'poor' }>({
    score: 100,
    rating: 'good'
  });

  useEffect(() => {
    const tracker = getPerformanceTracker();

    if (!tracker) return;

    // 주기적으로 업데이트
    const interval = setInterval(() => {
      const data = tracker.collectPerformanceData();
      setVitals(data.webVitals);
      setScore(tracker.getWebVitalsScore());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return { vitals, score };
}

// React import
import { useState, useEffect } from 'react';