import { d1Ping } from '@/lib/db/d1'
import { NextResponse } from 'next/server';

/**
 * Readiness check endpoint for v2 API
 * 
 * 이 엔드포인트는 서비스가 트래픽을 받을 준비가 되었는지 확인합니다.
 * 데이터베이스 연결, 외부 서비스 등의 상태를 검사합니다.
 */
export async function GET() {
  const checks: Record<string, boolean> = {
    database: false,
    cache: true, // 캐시는 선택적이므로 기본값 true
    config: false,
  };

  const details: Record<string, any> = {};

  try {
    // 1. 데이터베이스 연결 확인 (D1)
    const dbCheckStart = Date.now();
    try {
      const ping = await d1Ping()
      if (ping.ok) {
        checks.database = true;
        details.database = {
          status: 'connected',
          responseTime: Date.now() - dbCheckStart,
        };
      } else {
        details.database = {
          status: 'error',
          error: 'D1 ping failed',
          responseTime: Date.now() - dbCheckStart,
        };
      }
    } catch (dbError) {
      details.database = {
        status: 'error',
        error: dbError instanceof Error ? dbError.message : 'Unknown database error',
        responseTime: Date.now() - dbCheckStart,
      };
    }

    // 2. 환경 설정 확인
    const requiredEnvVars = [
      'D1_ENABLED'
    ];

    const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
    
    if (missingEnvVars.length === 0) {
      checks.config = true;
      details.config = {
        status: 'valid',
        environment: process.env.NODE_ENV,
      };
    } else {
      details.config = {
        status: 'invalid',
        missing: missingEnvVars,
      };
    }

    // 3. 메모리 사용량 확인
    const memoryUsage = process.memoryUsage();
    details.memory = {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    };

    // 메모리 사용량이 90% 이상이면 준비되지 않은 것으로 간주
    const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    if (memoryPercent > 90) {
      checks.memory = false;
      details.memory.warning = 'High memory usage';
      details.memory.percent = Math.round(memoryPercent);
    } else {
      checks.memory = true;
      details.memory.percent = Math.round(memoryPercent);
    }

    // 전체 준비 상태 확인
    const isReady = Object.values(checks).every(check => check);

    const response = {
      ready: isReady,
      timestamp: new Date().toISOString(),
      checks,
      details,
    };

    return NextResponse.json(response, {
      status: isReady ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Ready-Check': isReady ? 'true' : 'false',
      },
    });
  } catch (error) {
    console.error('Readiness check failed:', error);

    return NextResponse.json(
      {
        ready: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        checks,
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
          'X-Ready-Check': 'false',
        },
      }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
