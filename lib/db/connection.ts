// D1 데이터베이스 연결 설정
// Cloudflare D1 SQLite 전용

import { drizzle } from 'drizzle-orm/d1';
import { createClient } from '@libsql/client';
import * as schema from '@/drizzle/schema';

// D1 데이터베이스 연결 타입 정의
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

// 환경별 데이터베이스 연결 함수
export function getDatabase() {
  if (process.env.NODE_ENV === 'development') {
    // 개발 환경: 로컬 SQLite 파일 사용
    const client = createClient({
      url: 'file:./drizzle/dev.db'
    });
    return drizzle(client, { schema });
  }

  // 프로덕션 환경: Cloudflare D1 사용
  // Workers 런타임에서 env.DB를 통해 D1 인스턴스에 접근
  if (typeof globalThis !== 'undefined' && 'DB' in globalThis.env) {
    const d1Database = (globalThis.env as any).DB as D1Database;
    return drizzle(d1Database, { schema });
  }

  // 빌드 시점이나 서버 사이드 렌더링에서는 null 반환
  console.warn('데이터베이스 연결을 사용할 수 없습니다. 개발 환경이나 Workers 런타임에서만 사용 가능합니다.');
  return null;
}

// 데이터베이스 인스턴스 (개발 환경에서만 사용)
let db: ReturnType<typeof getDatabase> | null = null;

export function getDb() {
  if (!db) {
    db = getDatabase();
  }
  return db;
}

// 타입 내보내기
export type Database = NonNullable<ReturnType<typeof getDatabase>>;
export { schema };