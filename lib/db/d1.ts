// D1 데이터베이스 타입 (개발용 모킹)
interface MockD1Database {
  prepare: (query: string) => any;
  exec: (query: string) => Promise<any>;
  batch: (queries: any[]) => Promise<any>;
}

// 개발 환경에서는 실제 SQLite 데이터베이스를 사용
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// 개발용 SQLite 데이터베이스 경로
const DB_PATH = path.join(process.cwd(), 'dev.db');

// 환경에 따른 D1 데이터베이스 인스턴스 반환
export function getD1Database(): any {
  // 개발 환경에서는 로컬 SQLite 사용
  if (process.env.NODE_ENV === 'development') {
    try {
      // 데이터베이스 디렉토리 확인 및 생성
      const dbDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
      // SQLite 데이터베이스 연결
      const sqlite = new Database(DB_PATH);
      
      // D1 호환 래퍼 생성
      const d1Wrapper = {
        prepare: (query: string) => ({
          bind: (...params: any[]) => ({
            all: async () => {
              try {
                const stmt = sqlite.prepare(query);
                const results = stmt.all(...params);
                return { results, success: true };
              } catch (error) {
                console.error('Query error:', error);
                return { results: [], success: false, error };
              }
            },
            first: async () => {
              try {
                const stmt = sqlite.prepare(query);
                const result = stmt.get(...params);
                return result;
              } catch (error) {
                console.error('Query error:', error);
                return null;
              }
            },
            run: async () => {
              try {
                const stmt = sqlite.prepare(query);
                const result = stmt.run(...params);
                return { success: true, meta: result };
              } catch (error) {
                console.error('Query error:', error);
                return { success: false, error };
              }
            },
          }),
          all: async () => {
            try {
              const stmt = sqlite.prepare(query);
              const results = stmt.all();
              return { results, success: true };
            } catch (error) {
              console.error('Query error:', error);
              return { results: [], success: false, error };
            }
          },
          first: async () => {
            try {
              const stmt = sqlite.prepare(query);
              const result = stmt.get();
              return result;
            } catch (error) {
              console.error('Query error:', error);
              return null;
            }
          },
          run: async () => {
            try {
              const stmt = sqlite.prepare(query);
              const result = stmt.run();
              return { success: true, meta: result };
            } catch (error) {
              console.error('Query error:', error);
              return { success: false, error };
            }
          },
        }),
        exec: async (query: string) => {
          try {
            sqlite.exec(query);
            return { success: true };
          } catch (error) {
            console.error('Exec error:', error);
            return { success: false, error };
          }
        },
        batch: async (queries: any[]) => {
          const results = [];
          for (const query of queries) {
            try {
              const result = await query.all();
              results.push(result);
            } catch (error) {
              console.error('Batch error:', error);
              results.push({ success: false, error });
            }
          }
          return results;
        },
      };
      
      // 기본 테이블 생성 (존재하지 않을 때만)
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          email TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          phone TEXT,
          role TEXT DEFAULT 'user',
          profile_image TEXT,
          marketing_consent INTEGER DEFAULT 0,
          marketing_agreed INTEGER DEFAULT 0,
          push_notifications_enabled INTEGER DEFAULT 0,
          last_login_at INTEGER,
          created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
          updated_at INTEGER DEFAULT CURRENT_TIMESTAMP,
          emailVerified INTEGER DEFAULT 0,
          image TEXT
        );
        
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token TEXT NOT NULL UNIQUE,
          expires_at INTEGER NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
          updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS accounts (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          provider TEXT NOT NULL,
          provider_account_id TEXT NOT NULL,
          access_token TEXT,
          refresh_token TEXT,
          expires_at INTEGER,
          created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
          updated_at INTEGER DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(provider, provider_account_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
      `);
      
      return d1Wrapper;
    } catch (error) {
      console.error('Failed to create SQLite database:', error);
      // 에러 발생 시 모킹된 인스턴스 반환
      return getMockD1();
    }
  }
  
  // 프로덕션 환경에서도 일단 모킹된 인스턴스 사용 (나중에 실제 D1으로 교체)
  if (process.env.NODE_ENV === 'production') {
    // Cloudflare Worker 환경에서 실제 D1 바인딩 사용
    if (typeof globalThis !== 'undefined' && 'DB' in globalThis) {
      return (globalThis as any).DB;
    }
    return getMockD1();
  }
  
  return getMockD1(); // 기본값으로 mock 반환
}

// 모킹된 D1 인스턴스 생성 함수
function getMockD1(): MockD1Database {
  return {
    prepare: (query: string) => ({
      bind: (...params: any[]) => ({
        all: () => Promise.resolve({ results: [] }),
        first: () => Promise.resolve(null),
        run: () => Promise.resolve({ success: true }),
      }),
    }),
    exec: (query: string) => Promise.resolve({ results: [] }),
    batch: (queries: any[]) => Promise.resolve([]),
  };
}