import { NextResponse } from 'next/server';
import { createServiceRoleClient, handleSupabaseError } from '@/lib/supabase/service-role';

/**
 * Database health check endpoint
 * 
 * 데이터베이스 연결 상태와 성능을 모니터링합니다.
 */
export async function GET() {
  const startTime = Date.now();
  
  try {
    const supabase = createServiceRoleClient();
    const metrics = {
      status: 'healthy',
      responseTime: 0,
      connections: 0,
      tables: [] as string[],
      performance: {
        avgQueryTime: 0,
        slowQueries: 0,
      },
    };

    // 1. 기본 연결 테스트
    const connectStart = Date.now();
    const { error: testError } = await supabase
      .from('devices')
      .select('id')
      .limit(1);

    if (testError) {
      throw new Error(`Connection test failed: ${testError.message}`);
    }

    const connectTime = Date.now() - connectStart;

    // 2. 테이블 상태 확인
    const tables = ['devices', 'reservations', 'users', 'user_settings'];
    const tableChecks = await Promise.all(
      tables.map(async (table) => {
        const start = Date.now();
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        return {
          table,
          accessible: !error,
          rowCount: count || 0,
          queryTime: Date.now() - start,
          error: error?.message,
        };
      })
    );

    // 3. 성능 메트릭 계산
    const queryTimes = tableChecks.map(t => t.queryTime);
    const avgQueryTime = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;
    const slowQueries = queryTimes.filter(t => t > 500).length;

    // 4. 응답 구성
    metrics.responseTime = Date.now() - startTime;
    metrics.connections = tableChecks.filter(t => t.accessible).length;
    metrics.tables = tableChecks
      .filter(t => t.accessible)
      .map(t => t.table);
    metrics.performance = {
      avgQueryTime: Math.round(avgQueryTime),
      slowQueries,
    };

    // 상태 판단
    const allTablesAccessible = tableChecks.every(t => t.accessible);
    const performanceOk = avgQueryTime < 300 && slowQueries === 0;
    
    if (!allTablesAccessible) {
      metrics.status = 'degraded';
    } else if (!performanceOk) {
      metrics.status = 'slow';
    }

    // 상세 정보 추가
    const details = {
      ...metrics,
      connectTime,
      tableStatus: tableChecks,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(details, {
      status: metrics.status === 'unhealthy' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-store',
        'X-DB-Status': metrics.status,
        'X-Response-Time': `${metrics.responseTime}ms`,
      },
    });
  } catch (error) {
    const errorResponse = handleSupabaseError(error, 'Database health check failed');

    return NextResponse.json(
      {
        status: 'unhealthy',
        ...errorResponse,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
          'X-DB-Status': 'unhealthy',
        },
      }
    );
  }
}