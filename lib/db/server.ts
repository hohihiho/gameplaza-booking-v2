// 서버 전용 DB 클라이언트 (클라이언트 사이드에서 import 금지)
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';

// D1 데이터베이스 클라이언트 생성 (서버 전용)
export function createDB() {
  // 서버 환경 체크
  if (typeof window !== 'undefined') {
    throw new Error('DB client can only be used on the server side');
  }

  try {
    // 개발 환경에서는 로컬 SQLite 사용 - Better Auth와 동일한 DB 사용
    if (process.env.NODE_ENV === 'development' || !process.env.CLOUDFLARE_DATABASE_ID) {
      const dbPath = path.join(process.cwd(), 'cloudflare-auth.db');
      const sqlite = new Database(dbPath);
      
      // 외래 키 제약 비활성화 (개발 환경에서 문제 해결용)
      sqlite.pragma('foreign_keys = OFF');
      
      // 기본 테이블 생성 (Better Auth 용 - snake_case 통일)
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS user (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          name TEXT,
          email_verified INTEGER DEFAULT 0,
          image TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS session (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
          expires_at TEXT NOT NULL,
          token TEXT UNIQUE,
          ip_address TEXT,
          user_agent TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS account (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
          account_id TEXT NOT NULL,
          provider_id TEXT NOT NULL,
          access_token TEXT,
          refresh_token TEXT,
          id_token TEXT,
          access_token_expires_at TEXT,
          refresh_token_expires_at TEXT,
          scope TEXT,
          password TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
        );

        CREATE TABLE IF NOT EXISTS verification (
          id TEXT PRIMARY KEY,
          identifier TEXT NOT NULL,
          value TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_user_email ON user(email);
        CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
        CREATE INDEX IF NOT EXISTS idx_session_user_id ON session(user_id);
        CREATE INDEX IF NOT EXISTS idx_account_user_id ON account(user_id);
      `);
      
      return drizzle(sqlite, { 
        schema,
        logger: process.env.NODE_ENV === 'development' 
      });
    }
    
    // 프로덕션 환경 (Cloudflare D1)
    console.warn('Cloudflare D1 not yet configured, using SQLite');
    const dbPath = path.join(process.cwd(), 'cloudflare-auth.db');
    const sqlite = new Database(dbPath);
    return drizzle(sqlite, { schema });
    
  } catch (error) {
    console.error('Error creating DB:', error);
    // 에러 발생 시 메모리 DB 사용
    const sqlite = new Database(':memory:');
    return drizzle(sqlite, { schema });
  }
}

// 싱글톤 인스턴스
let dbInstance: ReturnType<typeof createDB> | null = null;

// 데이터베이스 인스턴스 가져오기 (서버 전용)
export function getDB() {
  if (typeof window !== 'undefined') {
    throw new Error('DB can only be accessed on the server side');
  }
  
  if (!dbInstance) {
    dbInstance = createDB();
  }
  return dbInstance;
}

// Raw SQLite 인스턴스를 위한 함수 (business_info API용)
export function getRawDB() {
  if (typeof window !== 'undefined') {
    throw new Error('Raw DB can only be accessed on the server side');
  }
  
  try {
    const dbPath = path.join(process.cwd(), 'cloudflare-auth.db');
    const sqlite = new Database(dbPath);
    return sqlite;
  } catch (error) {
    console.error('Error creating raw DB:', error);
    return new Database(':memory:');
  }
}

// 타입 익스포트
export type DB = ReturnType<typeof createDB>;