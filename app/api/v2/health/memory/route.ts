import { NextResponse } from 'next/server';

/**
 * Memory usage monitoring endpoint
 * 
 * 애플리케이션의 메모리 사용량을 모니터링합니다.
 */
export async function GET() {
  try {
    const memoryUsage = process.memoryUsage();
    
    // 메모리 사용량을 MB 단위로 변환
    const toMB = (bytes: number) => Math.round(bytes / 1024 / 1024 * 100) / 100;
    
    // 시스템 메모리 정보 (Node.js 14.x 이상)
    const totalMemory = process.constrainedMemory?.() || 0;
    
    const usage = {
      // 힙 메모리
      heap: {
        used_mb: toMB(memoryUsage.heapUsed),
        total_mb: toMB(memoryUsage.heapTotal),
        limit_mb: totalMemory ? toMB(totalMemory) : null,
        percent: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
      },
      
      // RSS (Resident Set Size) - 전체 메모리 사용량
      rss_mb: toMB(memoryUsage.rss),
      
      // External - V8 엔진 외부 C++ 객체
      external_mb: toMB(memoryUsage.external),
      
      // Array buffers
      arrayBuffers_mb: toMB(memoryUsage.arrayBuffers || 0),
      
      // 총 사용량
      total_mb: toMB(memoryUsage.rss),
      
      // 메모리 제한 (Vercel 환경)
      limit_mb: totalMemory ? toMB(totalMemory) : (
        process.env.VERCEL ? 1024 : null // Vercel은 기본 1GB
      ),
      
      // 메모리 압박 상태
      pressure: 'normal' as 'normal' | 'warning' | 'critical',
      
      // 가비지 컬렉션 정보
      gc: {
        last_run: null as string | null,
        next_scheduled: null as string | null,
      },
      
      // 타임스탬프
      timestamp: new Date().toISOString(),
    };
    
    // 메모리 압박 수준 계산
    if (usage.heap.percent > 90 || (usage.limit_mb && usage.total_mb / usage.limit_mb > 0.9)) {
      usage.pressure = 'critical';
    } else if (usage.heap.percent > 75 || (usage.limit_mb && usage.total_mb / usage.limit_mb > 0.75)) {
      usage.pressure = 'warning';
    }
    
    // 가비지 컬렉션 강제 실행 (critical 상태일 때만)
    if (usage.pressure === 'critical' && global.gc) {
      try {
        global.gc();
        usage.gc.last_run = new Date().toISOString();
      } catch (e) {
        console.error('Failed to run garbage collection:', e);
      }
    }
    
    // 메모리 사용량 로깅 (warning 이상)
    if (usage.pressure !== 'normal') {
      console.warn(`Memory pressure ${usage.pressure}:`, {
        heap_percent: usage.heap.percent,
        total_mb: usage.total_mb,
        limit_mb: usage.limit_mb,
      });
    }
    
    // 응답 헤더
    const headers = {
      'Cache-Control': 'no-store',
      'X-Memory-Pressure': usage.pressure,
      'X-Memory-Used': `${usage.total_mb}MB`,
    };
    
    if (usage.limit_mb) {
      headers['X-Memory-Limit'] = `${usage.limit_mb}MB`;
    }
    
    return NextResponse.json(usage, {
      status: usage.pressure === 'critical' ? 503 : 200,
      headers,
    });
  } catch (error) {
    console.error('Memory health check failed:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
          'X-Memory-Pressure': 'unknown',
        },
      }
    );
  }
}