import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * Health check endpoint for v2 API
 * 
 * 이 엔드포인트는 서비스의 기본적인 상태를 확인합니다.
 * 로드 밸런서와 모니터링 시스템에서 사용됩니다.
 */
export async function GET() {
  const startTime = Date.now();
  
  try {
    // 기본 상태 정보
    const health = {
      status: 'healthy',
      version: 'v2',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      
      // 응답 시간
      responseTime: 0, // 마지막에 계산
      
      // 서버 정보
      server: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      
      // Feature flags
      features: {
        v2ApiEnabled: process.env.FEATURE_FLAG_V2_API === 'true',
        canaryDeployment: process.env.CANARY_DEPLOYMENT === 'true',
        canaryPercentage: parseInt(process.env.CANARY_PERCENTAGE || '0'),
      },
    };

    // 응답 시간 계산
    health.responseTime = Date.now() - startTime;

    // 헤더 설정
    const responseHeaders = {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Health-Check': 'true',
      'X-Response-Time': `${health.responseTime}ms`,
    };

    return NextResponse.json(health, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
          'X-Health-Check': 'true',
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