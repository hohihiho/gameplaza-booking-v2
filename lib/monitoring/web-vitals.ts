// TODO: web-vitals 패키지 설치 필요
// import { onCLS, onFCP, onFID, onINP, onLCP, onTTFB, Metric } from 'web-vitals'

type Metric = {
  name: string;
  value: number;
  id: string;
}

// Web Vitals 임계값 (밀리초)
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },   // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 },  // First Contentful Paint
  INP: { good: 200, poor: 500 },    // Interaction to Next Paint
  TTFB: { good: 800, poor: 1800 },  // Time to First Byte
}

// 성능 등급 판단
function getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metric as keyof typeof THRESHOLDS]
  if (!threshold) return 'needs-improvement'
  
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

// 메트릭 데이터 타입
interface MetricData {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta?: number
  id: string
  entries?: PerformanceEntry[]
  navigationType?: string
}

// 메트릭 리포팅 함수
function reportMetric(metric: Metric) {
  const data: MetricData = {
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.delta,
    id: metric.id,
    entries: metric.entries,
    navigationType: metric.navigationType,
  }
  
  // 콘솔에 로그 (개발 환경)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: `${metric.value.toFixed(2)}${metric.name === 'CLS' ? '' : 'ms'}`,
      rating: data.rating,
      delta: metric.delta,
    })
  }
  
  // 분석 서비스로 전송 (프로덕션 환경)
  if (process.env.NODE_ENV === 'production') {
    // Google Analytics로 전송
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta,
        metric_rating: data.rating,
      })
    }
    
    // 커스텀 분석 엔드포인트로 전송
    sendToAnalytics('/api/analytics/web-vitals', data)
  }
  
  // 성능이 나쁜 경우 경고
  if (data.rating === 'poor') {
    console.warn(`[Web Vitals] Poor ${metric.name} detected:`, metric.value)
    
    // 추가 디버깅 정보 수집
    if (metric.name === 'LCP' && metric.entries?.length) {
      const lcpEntry = metric.entries[metric.entries.length - 1]
      console.warn('LCP element:', lcpEntry)
    }
    
    if (metric.name === 'CLS' && metric.entries?.length) {
      console.warn('Layout shift sources:', metric.entries)
    }
  }
}

// 분석 서비스로 데이터 전송
async function sendToAnalytics(endpoint: string, data: MetricData) {
  try {
    // navigator.sendBeacon 사용 (페이지 언로드 시에도 전송 보장)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        connection: (navigator as any).connection?.effectiveType,
      })], { type: 'application/json' })
      
      navigator.sendBeacon(endpoint, blob)
    } else {
      // 폴백: fetch 사용
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
        keepalive: true,
      })
    }
  } catch (error) {
    console.error('[Web Vitals] Failed to send analytics:', error)
  }
}

// Web Vitals 모니터링 초기화
export function initWebVitals() {
  // 모든 Core Web Vitals 측정
  onLCP(reportMetric)    // Largest Contentful Paint
  onFID(reportMetric)    // First Input Delay (INP로 대체 예정)
  onCLS(reportMetric)    // Cumulative Layout Shift
  
  // 추가 메트릭
  onFCP(reportMetric)    // First Contentful Paint
  onINP(reportMetric)    // Interaction to Next Paint (FID 대체)
  onTTFB(reportMetric)   // Time to First Byte
  
  // 페이지 가시성 변경 시 최종 메트릭 전송
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // 대기 중인 모든 메트릭 즉시 전송
      onLCP(reportMetric, { reportAllChanges: true })
      onFID(reportMetric, { reportAllChanges: true })
      onCLS(reportMetric, { reportAllChanges: true })
    }
  })
}

// 커스텀 성능 마크
export function markPerformance(markName: string) {
  if (performance.mark) {
    performance.mark(markName)
  }
}

// 커스텀 성능 측정
export function measurePerformance(measureName: string, startMark: string, endMark?: string) {
  if (performance.measure) {
    try {
      const measure = performance.measure(measureName, startMark, endMark)
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${measureName}:`, `${measure.duration.toFixed(2)}ms`)
      }
      
      return measure.duration
    } catch (error) {
      console.error('[Performance] Measurement failed:', error)
    }
  }
  return null
}

// 리소스 타이밍 분석
export function analyzeResourceTiming() {
  if (!performance.getEntriesByType) return
  
  const resources = performance.getEntriesByType('resource')
  const summary = {
    total: resources.length,
    images: 0,
    scripts: 0,
    stylesheets: 0,
    fonts: 0,
    slowResources: [] as any[],
  }
  
  resources.forEach((entry: any) => {
    // 리소스 타입 분류
    if (entry.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      summary.images++
    } else if (entry.name.match(/\.js$/i)) {
      summary.scripts++
    } else if (entry.name.match(/\.css$/i)) {
      summary.stylesheets++
    } else if (entry.name.match(/\.(woff|woff2|ttf|otf)$/i)) {
      summary.fonts++
    }
    
    // 느린 리소스 감지 (1초 이상)
    if (entry.duration > 1000) {
      summary.slowResources.push({
        name: entry.name,
        duration: entry.duration,
        type: entry.initiatorType,
      })
    }
  })
  
  if (process.env.NODE_ENV === 'development' && summary.slowResources.length > 0) {
    console.warn('[Performance] Slow resources detected:', summary.slowResources)
  }
  
  return summary
}

// 전역 window 타입 확장
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}