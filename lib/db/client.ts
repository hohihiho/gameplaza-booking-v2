import { drizzle } from 'drizzle-orm/d1'
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'

// 개발 환경에서는 SQLite, 프로덕션에서는 Cloudflare D1
let db: ReturnType<typeof drizzle> | ReturnType<typeof drizzleSqlite>

if (process.env.NODE_ENV === 'development') {
  // 개발 환경: Better SQLite3 사용
  const sqlite = new Database(':memory:') // 메모리 데이터베이스
  db = drizzleSqlite(sqlite, { schema })
  
  // 개발용 테이블 생성 (간단한 스키마)
  try {
    sqlite.exec(`
      -- Better Auth 테이블들
      CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        emailVerified INTEGER NOT NULL DEFAULT 0,
        image TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS session (
        id TEXT PRIMARY KEY,
        expiresAt INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        ipAddress TEXT,
        userAgent TEXT,
        userId TEXT NOT NULL REFERENCES user(id)
      );
      
      CREATE TABLE IF NOT EXISTS account (
        id TEXT PRIMARY KEY,
        accountId TEXT NOT NULL,
        providerId TEXT NOT NULL,
        userId TEXT NOT NULL REFERENCES user(id),
        accessToken TEXT,
        refreshToken TEXT,
        idToken TEXT,
        accessTokenExpiresAt INTEGER,
        refreshTokenExpiresAt INTEGER,
        scope TEXT,
        password TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS verification (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expiresAt INTEGER NOT NULL,
        createdAt INTEGER,
        updatedAt INTEGER
      );
      
      -- 게임플라자 테이블들
      CREATE TABLE IF NOT EXISTS content_pages (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        isPublished INTEGER NOT NULL DEFAULT 0,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        deviceNumber INTEGER NOT NULL,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'available',
        floor INTEGER NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS schedule_events (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        eventType TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
    `)
    
    // 기본 데이터 삽입
    const now = Date.now()
    sqlite.exec(`
      INSERT OR REPLACE INTO content_pages (id, slug, title, content, isPublished, createdAt, updatedAt) VALUES 
      ('terms', 'terms_of_service', '이용약관', '게임플라자 이용약관 내용입니다.', 1, ${now}, ${now}),
      ('privacy', 'privacy_policy', '개인정보처리방침', '게임플라자 개인정보처리방침 내용입니다.', 1, ${now}, ${now});
      
      INSERT OR REPLACE INTO devices (id, deviceNumber, name, status, floor, createdAt, updatedAt) VALUES 
      ('dev-ps5-1', 1, 'PS5 #1', 'available', 2, ${now}, ${now}),
      ('dev-ps5-2', 2, 'PS5 #2', 'in_use', 2, ${now}, ${now}),
      ('dev-switch-1', 3, '스위치 #1', 'available', 1, ${now}, ${now});
    `)
    
    console.log('✅ 개발용 데이터베이스 초기화 완료')
  } catch (error) {
    console.log('⚠️ 개발용 데이터베이스 초기화 건너뜀:', error)
  }
} else {
  // 프로덕션 환경: Cloudflare D1 사용
  db = drizzle((globalThis as any).GAMEPLAZA_DB, { schema })
}

export { db }
export * from './schema'