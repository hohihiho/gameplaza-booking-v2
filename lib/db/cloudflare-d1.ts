// Cloudflare D1 데이터베이스 연결 설정
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@/drizzle/schema';

// Cloudflare D1 Database 바인딩 타입
export interface Env {
  DB: D1Database;
  ENVIRONMENT: 'development' | 'production';
}

// D1 데이터베이스 ID 설정
const D1_DATABASE_IDS = {
  development: 'd8bb6ff7-b731-4d5a-b22f-4b3e41c9ed8e',
  production: '1d59afcb-f4c2-4d1c-9532-a63bd124bf97'
} as const;

// 현재 환경 확인
const getEnvironment = (): 'development' | 'production' => {
  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
};

// D1 데이터베이스 인스턴스 가져오기
export function getD1Database(env?: Env): D1Database | null {
  // Workers 환경에서 실행 중인 경우
  if (env?.DB) {
    return env.DB;
  }

  // Edge Runtime에서 실행 중인 경우 (Vercel Edge Functions 등)
  if (typeof globalThis !== 'undefined' && 'env' in globalThis) {
    const globalEnv = (globalThis as any).env as Env;
    if (globalEnv?.DB) {
      return globalEnv.DB;
    }
  }

  // 개발 환경 로깅
  if (process.env.NODE_ENV === 'development') {
    console.warn('D1 Database not available in this context');
  }

  return null;
}

// Drizzle ORM 인스턴스 생성
export function getDb(env?: Env) {
  const d1 = getD1Database(env);

  if (!d1) {
    // 개발 환경에서는 더미 클라이언트 반환
    if (process.env.NODE_ENV === 'development') {
      console.log('Using dummy client for development');
      // 더미 클라이언트 import는 순환 참조를 피하기 위해 동적으로
      const { supabase } = require('./dummy-client');
      return supabase as any;
    }

    throw new Error('D1 Database is not available');
  }

  return drizzle(d1, { schema });
}

// 데이터베이스 정보 가져오기
export function getDatabaseInfo() {
  const environment = getEnvironment();
  return {
    environment,
    databaseId: D1_DATABASE_IDS[environment],
    databaseName: environment === 'production' ? 'gameplaza-production' : 'gameplaza-development'
  };
}

// 마이그레이션 실행 (Workers 환경에서만)
export async function runMigrations(env: Env) {
  const db = getDb(env);
  if (!db) {
    throw new Error('Cannot run migrations without D1 database');
  }

  // 마이그레이션 로직은 wrangler d1 migrations로 처리
  console.log('Migrations should be run using wrangler d1 migrations');
  return true;
}

// 헬퍼 함수: SQL 쿼리 실행
export async function executeSQL(env: Env, sql: string, params?: any[]) {
  const d1 = getD1Database(env);
  if (!d1) {
    throw new Error('D1 Database not available');
  }

  try {
    const stmt = d1.prepare(sql);
    if (params && params.length > 0) {
      return await stmt.bind(...params).all();
    }
    return await stmt.all();
  } catch (error) {
    console.error('SQL execution error:', error);
    throw error;
  }
}

// 트랜잭션 실행
export async function transaction<T>(
  env: Env,
  callback: (tx: any) => Promise<T>
): Promise<T> {
  const db = getDb(env);
  if (!db) {
    throw new Error('D1 Database not available for transaction');
  }

  // Drizzle의 트랜잭션 사용
  return await (db as any).transaction(callback);
}

// 연결 상태 확인
export async function checkConnection(env: Env): Promise<boolean> {
  try {
    await executeSQL(env, 'SELECT 1');
    return true;
  } catch (error) {
    console.error('Connection check failed:', error);
    return false;
  }
}

// Export types
export type Database = ReturnType<typeof getDb>;
export type { D1Database } from '@cloudflare/workers-types';