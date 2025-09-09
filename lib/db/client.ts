import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';

// D1 데이터베이스 클라이언트 생성
export function createDB() {
  try {
    // 개발 환경에서는 로컬 SQLite 사용
    if (process.env.NODE_ENV === 'development' || !process.env.CLOUDFLARE_DATABASE_ID) {
      const dbPath = path.join(process.cwd(), 'dev.db');
      const sqlite = new Database(dbPath);
      
      // 기본 테이블 생성 (Better Auth 용)
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS user (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          emailVerified INTEGER DEFAULT 0,
          image TEXT,
          createdAt INTEGER DEFAULT CURRENT_TIMESTAMP,
          updatedAt INTEGER DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS session (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
          expiresAt INTEGER NOT NULL,
          token TEXT UNIQUE,
          createdAt INTEGER DEFAULT CURRENT_TIMESTAMP,
          updatedAt INTEGER DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS account (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
          accountId TEXT NOT NULL,
          providerId TEXT NOT NULL,
          accessToken TEXT,
          refreshToken TEXT,
          idToken TEXT,
          expiresAt INTEGER,
          createdAt INTEGER DEFAULT CURRENT_TIMESTAMP,
          updatedAt INTEGER DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_user_email ON user(email);
        CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
        CREATE INDEX IF NOT EXISTS idx_session_userId ON session(userId);
        CREATE INDEX IF NOT EXISTS idx_account_userId ON account(userId);
      `);
      
      return drizzle(sqlite, { 
        schema,
        logger: process.env.NODE_ENV === 'development' 
      });
    }
    
    // 프로덕션 환경 (Cloudflare D1)
    console.warn('Cloudflare D1 not yet configured, using SQLite');
    const dbPath = path.join(process.cwd(), 'dev.db');
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

// 데이터베이스 인스턴스 가져오기
export function getDB() {
  if (!dbInstance) {
    dbInstance = createDB();
  }
  return dbInstance;
}

// Raw SQLite 인스턴스를 위한 함수 (business_info API용)
export function getRawDB() {
  try {
    const dbPath = path.join(process.cwd(), 'dev.db');
    const sqlite = new Database(dbPath);
    return sqlite;
  } catch (error) {
    console.error('Error creating raw DB:', error);
    return new Database(':memory:');
  }
}

// 타입 익스포트
export type DB = ReturnType<typeof createDB>;