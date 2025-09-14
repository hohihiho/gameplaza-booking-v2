import { NextResponse } from 'next/server';

// 메트릭 저장을 위한 메모리 스토어 (실제로는 Redis나 다른 저장소 사용)
const metricsStore = {
  requests: 0,
  errors: 0,
  responseTimes: [] as number[],
  errorDetails: [] as { timestamp: string; error: string; path: string }[],
  lastReset: new Date().toISOString(),
};

/**
 * Metrics collection endpoint
 * 
 * API 성능 메트릭을 수집하고 제공합니다.
 */
export async function GET() {
  try {
    // 응답 시간 통계 계산
    const sortedTimes = [...metricsStore.responseTimes].sort((a, b) => a - b);
    const calculatePercentile = (p: number) => {
      if (sortedTimes.length === 0) return 0;
      const index = Math.ceil((p / 100) * sortedTimes.length) - 1;
      return sortedTimes[index] || 0;
    };

    const metrics = {
      // 요청 수
      requests: metricsStore.requests,
      errors: metricsStore.errors,
      error_rate: metricsStore.requests > 0 
        ? (metricsStore.errors / metricsStore.requests) * 100 
        : 0,

      // 응답 시간
      response_time: {
        p50: calculatePercentile(50),
        p95: calculatePercentile(95),
        p99: calculatePercentile(99),
        min: sortedTimes[0] || 0,
        max: sortedTimes[sortedTimes.length - 1] || 0,
        avg: sortedTimes.length > 0
          ? sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length
          : 0,
      },

      // 시스템 메트릭
      system: {
        cpu_percent: getCPUUsage(),
        memory_percent: getMemoryUsage(),
        uptime_seconds: process.uptime(),
      },

      // 최근 에러 (최대 10개)
      recent_errors: metricsStore.errorDetails.slice(-10),

      // 메트릭 수집 정보
      collection: {
        duration_seconds: Math.floor(
          (Date.now() - new Date(metricsStore.lastReset).getTime()) / 1000
        ),
        last_reset: metricsStore.lastReset,
      },

      // 타임스탬프
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(metrics, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=10',
        'X-Metrics-Requests': String(metrics.requests),
        'X-Metrics-Errors': String(metrics.errors),
      },
    });
  } catch (error) {
    console.error('Failed to get metrics:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST - 메트릭 기록
 *
 * 내부적으로 미들웨어나 다른 API 엔드포인트에서 호출되며,
 * 클라이언트 사이드에서도 성능 메트릭을 전송받습니다.
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // 클라이언트 메트릭 처리
    if (data.type === 'client-metrics' && data.metrics) {
      // 집계된 메트릭 각각을 개별 메트릭으로 처리
      data.metrics.forEach((metric: any) => {
        metricsStore.requests += metric.count || 1;
        if (metric.errors > 0) {
          metricsStore.errors += metric.errors;
        }

        // 응답 시간 추가
        if (metric.avgDuration) {
          metricsStore.responseTimes.push(metric.avgDuration);
        }
        if (metric.maxDuration) {
          metricsStore.responseTimes.push(metric.maxDuration);
        }
        if (metric.minDuration && metric.minDuration !== Infinity) {
          metricsStore.responseTimes.push(metric.minDuration);
        }
      });

      // 원시 데이터 처리
      if (data.raw && Array.isArray(data.raw)) {
        data.raw.forEach((raw: any) => {
          if (raw.duration) {
            metricsStore.responseTimes.push(raw.duration);
          }
          if (raw.error) {
            metricsStore.errors++;
            metricsStore.errorDetails.push({
              timestamp: raw.timestamp || new Date().toISOString(),
              error: raw.error,
              path: raw.endpoint || 'unknown',
            });
          }
        });
      }

      // 메모리 관리
      if (metricsStore.responseTimes.length > 1000) {
        metricsStore.responseTimes = metricsStore.responseTimes.slice(-1000);
      }
      if (metricsStore.errorDetails.length > 100) {
        metricsStore.errorDetails = metricsStore.errorDetails.slice(-100);
      }

      console.log('클라이언트 메트릭 수집:', {
        메트릭수: data.metrics.length,
        총요청수: metricsStore.requests,
        에러수: metricsStore.errors
      });
    }
    // 기존 서버 메트릭 처리
    else if (data.type === 'request') {
      metricsStore.requests++;

      // 응답 시간 기록
      if (data.responseTime) {
        metricsStore.responseTimes.push(data.responseTime);

        // 메모리 관리: 최대 1000개의 샘플만 유지
        if (metricsStore.responseTimes.length > 1000) {
          metricsStore.responseTimes = metricsStore.responseTimes.slice(-1000);
        }
      }
    }
    // 에러 기록
    else if (data.type === 'error') {
      metricsStore.errors++;

      // 에러 상세 정보 저장
      if (data.error) {
        metricsStore.errorDetails.push({
          timestamp: new Date().toISOString(),
          error: data.error,
          path: data.path || 'unknown',
        });

        // 최대 100개의 에러만 유지
        if (metricsStore.errorDetails.length > 100) {
          metricsStore.errorDetails = metricsStore.errorDetails.slice(-100);
        }
      }

      console.error('에러 메트릭 수집:', {
        에러: data.error,
        경로: data.path,
        응답시간: data.responseTime
      });
    }

    // 메트릭 리셋 (1시간마다)
    const hoursSinceReset = (Date.now() - new Date(metricsStore.lastReset).getTime()) / (1000 * 60 * 60);
    if (hoursSinceReset > 1) {
      resetMetrics();
    }

    return NextResponse.json({
      success: true,
      stored: {
        requests: metricsStore.requests,
        errors: metricsStore.errors
      }
    });
  } catch (error) {
    console.error('Failed to record metric:', error);

    return NextResponse.json(
      { error: 'Failed to record metric' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - 메트릭 리셋
 */
export async function DELETE() {
  resetMetrics();
  
  return NextResponse.json({
    message: 'Metrics reset successfully',
    timestamp: new Date().toISOString(),
  });
}

/**
 * 메트릭 초기화
 */
function resetMetrics() {
  metricsStore.requests = 0;
  metricsStore.errors = 0;
  metricsStore.responseTimes = [];
  metricsStore.errorDetails = [];
  metricsStore.lastReset = new Date().toISOString();
}

/**
 * CPU 사용률 계산 (근사치)
 */
function getCPUUsage(): number {
  // Node.js에서 정확한 CPU 사용률을 얻기 어려우므로 근사치 사용
  // 실제 환경에서는 APM 도구 활용 권장
  const usage = process.cpuUsage();
  const totalUsage = usage.user + usage.system;
  const uptime = process.uptime() * 1000000; // 마이크로초로 변환
  
  return Math.min(100, Math.round((totalUsage / uptime) * 100));
}

/**
 * 메모리 사용률 계산
 */
function getMemoryUsage(): number {
  const memoryUsage = process.memoryUsage();
  const totalMemory = process.constrainedMemory?.() || memoryUsage.heapTotal * 2;
  
  return Math.round((memoryUsage.rss / totalMemory) * 100);
}