import { getDB, supabase } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * External dependencies health check
 * 
 * 외부 서비스들의 상태를 확인합니다.
 */
export async function GET() {
  const dependencies = {
    supabase: {
      name: 'Supabase',
      status: 'unknown' as 'operational' | 'degraded' | 'down' | 'unknown',
      responseTime: 0,
      lastChecked: new Date().toISOString(),
    },
    vercel: {
      name: 'Vercel',
      status: 'unknown' as 'operational' | 'degraded' | 'down' | 'unknown',
      responseTime: 0,
      lastChecked: new Date().toISOString(),
    },
  };

  try {
    // 1. Supabase 상태 확인
    const supabaseStart = Date.now();
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
        signal: AbortSignal.timeout(5000), // 5초 타임아웃
      });

      dependencies.supabase.responseTime = Date.now() - supabaseStart;
      
      if (response.ok) {
        dependencies.supabase.status = 'operational';
      } else if (response.status >= 500) {
        dependencies.supabase.status = 'down';
      } else {
        dependencies.supabase.status = 'degraded';
      }
    } catch (error) {
      dependencies.supabase.status = 'down';
      dependencies.supabase.responseTime = Date.now() - supabaseStart;
    }

    // 2. Vercel 상태 확인 (Edge Config)
    const vercelStart = Date.now();
    try {
      if (process.env.EDGE_CONFIG) {
        // Edge Config는 환경 변수로 확인
        dependencies.vercel.status = 'operational';
        dependencies.vercel.responseTime = Date.now() - vercelStart;
      } else {
        dependencies.vercel.status = 'unknown';
      }
    } catch (error) {
      dependencies.vercel.status = 'degraded';
      dependencies.vercel.responseTime = Date.now() - vercelStart;
    }

    // 전체 상태 계산
    const allOperational = Object.values(dependencies).every(
      dep => dep.status === 'operational' || dep.status === 'unknown'
    );
    
    const anyDown = Object.values(dependencies).some(
      dep => dep.status === 'down'
    );

    const overallStatus = anyDown ? 'critical' : 
                         !allOperational ? 'degraded' : 
                         'healthy';

    const response = {
      status: overallStatus,
      dependencies,
      summary: {
        total: Object.keys(dependencies).length,
        operational: Object.values(dependencies).filter(d => d.status === 'operational').length,
        degraded: Object.values(dependencies).filter(d => d.status === 'degraded').length,
        down: Object.values(dependencies).filter(d => d.status === 'down').length,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      status: overallStatus === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, max-age=30',
        'X-Dependencies-Status': overallStatus,
      },
    });
  } catch (error) {
    console.error('Dependencies health check failed:', error);

    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        dependencies,
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
          'X-Dependencies-Status': 'error',
        },
      }
    );
  }
}