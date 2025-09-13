// 개선된 데이터베이스 연결 및 쿼리 매니저
import { Pool, PoolClient } from 'pg';
import { DatabaseResult, DatabaseClient, TransactionCallback } from './types';

// 연결 풀 설정 - 최적화된 설정값
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // 연결 풀 최적화 설정
  max: 20, // 최대 연결 수
  idleTimeoutMillis: 30000, // 유휴 연결 타임아웃
  connectionTimeoutMillis: 2000, // 연결 타임아웃
});

/**
 * 기본 쿼리 실행 함수
 * 연결 풀에서 클라이언트를 가져와 쿼리 실행 후 자동으로 반환
 */
export async function query<T = any>(text: string, params?: any[]): Promise<DatabaseResult<T>> {
  const client = await pool.connect();
  try {
    const startTime = Date.now();
    const result = await client.query(text, params);
    const duration = Date.now() - startTime;

    // 성능 로깅 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.log(`🐌 [DB] Slow query (${duration}ms):`, text.substring(0, 100));
    }

    return {
      data: result.rows as T,
      error: null,
      count: result.rowCount || 0
    };
  } catch (error) {
    console.error('🚨 [DB] Query error:', error);
    return {
      data: null,
      error: error as Error,
      count: 0
    };
  } finally {
    client.release();
  }
}

/**
 * 단일 행 쿼리 실행 함수
 */
export async function queryOne<T = any>(text: string, params?: any[]): Promise<DatabaseResult<T>> {
  const result = await query<T[]>(text, params);

  return {
    data: result.data?.[0] || null,
    error: result.error,
    count: result.count
  };
}

/**
 * 트랜잭션 실행 함수
 * 여러 쿼리를 원자적으로 실행할 때 사용
 */
export async function transaction<T>(callback: TransactionCallback<T>): Promise<DatabaseResult<T>> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 트랜잭션 컨텍스트에서 사용할 쿼리 함수들을 제공
    const transactionContext = {
      query: async <R = any>(text: string, params?: any[]) => {
        const result = await client.query(text, params);
        return {
          data: result.rows as R,
          error: null,
          count: result.rowCount || 0
        };
      },
      queryOne: async <R = any>(text: string, params?: any[]) => {
        const result = await client.query(text, params);
        return {
          data: result.rows[0] || null,
          error: null,
          count: result.rowCount || 0
        };
      }
    };

    // 콜백 함수에 트랜잭션 컨텍스트를 전달
    const result = await callback.call(transactionContext);

    await client.query('COMMIT');

    return {
      data: result,
      error: null
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('🚨 [DB] Transaction error:', error);

    return {
      data: null,
      error: error as Error
    };
  } finally {
    client.release();
  }
}

/**
 * 연결 풀에서 클라이언트를 직접 가져오기
 * 복잡한 작업이나 스트리밍이 필요한 경우 사용
 */
export async function getClient(): Promise<PoolClient> {
  return await pool.connect();
}

/**
 * 연결 풀 상태 확인
 */
export function getPoolStatus() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
}

/**
 * 애플리케이션 종료 시 연결 풀 정리
 */
export async function closePool() {
  await pool.end();
}

// 프로세스 종료 시 연결 풀 정리
process.on('SIGTERM', closePool);
process.on('SIGINT', closePool);