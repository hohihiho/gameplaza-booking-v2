import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../db/schema';
import path from 'path';

// Cloudflare D1 호환 데이터베이스 연결
function createCloudflareDB() {
  try {
    // 개발 환경에서는 로컬 SQLite
    if (process.env.NODE_ENV === 'development') {
      const dbPath = path.join(process.cwd(), 'cloudflare-auth.db');
      console.log('🗄️ Cloudflare Auth DB:', dbPath);
      
      const sqlite = new Database(dbPath);
      
      // Better Auth 테이블 생성 (snake_case와 camelCase 혼용)
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS user (
          id TEXT PRIMARY KEY,
          name TEXT,
          email TEXT NOT NULL UNIQUE,
          email_verified INTEGER DEFAULT 0,
          image TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS session (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          token TEXT NOT NULL UNIQUE,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS account (
          id TEXT PRIMARY KEY,
          account_id TEXT NOT NULL,
          provider_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          access_token TEXT,
          refresh_token TEXT,
          id_token TEXT,
          access_token_expires_at TEXT,
          refresh_token_expires_at TEXT,
          scope TEXT,
          password TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS verification (
          id TEXT PRIMARY KEY,
          identifier TEXT NOT NULL,
          value TEXT NOT NULL,
          expiresAt TEXT NOT NULL,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_user_email ON user(email);
        CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
        CREATE INDEX IF NOT EXISTS idx_session_user_id ON session(user_id);
        CREATE INDEX IF NOT EXISTS idx_account_user_id ON account(user_id);
      `);
      
      // Better Auth 최적화 설정
      sqlite.pragma('journal_mode = WAL');
      sqlite.pragma('synchronous = NORMAL');
      sqlite.pragma('foreign_keys = ON');
      
      // SQLite의 모든 실행 메서드를 오버라이드하여 Date 자동 변환
      const originalExec = sqlite.exec.bind(sqlite);
      const originalPrepare = sqlite.prepare.bind(sqlite);
      
      // exec 메서드 오버라이드
      sqlite.exec = function(sql: string) {
        return originalExec(sql);
      };
      
      // prepare 메서드 오버라이드
      sqlite.prepare = function(sql: string) {
        const stmt = originalPrepare(sql);
        
        // bind 메서드 오버라이드
        const originalBind = stmt.bind ? stmt.bind.bind(stmt) : null;
        if (originalBind) {
          stmt.bind = function(...params: any[]) {
            const transformed = params.map(p => p instanceof Date ? p.toISOString() : p);
            return originalBind(...transformed);
          };
        }
        
        // run 메서드 오버라이드
        const originalRun = stmt.run.bind(stmt);
        stmt.run = function(...params: any[]) {
          const transformed = params.map(p => p instanceof Date ? p.toISOString() : p);
          return originalRun(...transformed);
        };
        
        // get 메서드 오버라이드
        const originalGet = stmt.get.bind(stmt);
        stmt.get = function(...params: any[]) {
          const transformed = params.map(p => p instanceof Date ? p.toISOString() : p);
          return originalGet(...transformed);
        };
        
        // all 메서드 오버라이드
        const originalAll = stmt.all.bind(stmt);
        stmt.all = function(...params: any[]) {
          const transformed = params.map(p => p instanceof Date ? p.toISOString() : p);
          return originalAll(...transformed);
        };
        
        return stmt;
      };
      
      // Drizzle 인스턴스 생성
      const db = drizzle(sqlite, { 
        schema,
        logger: process.env.NODE_ENV === 'development'
      });
      
      return db;
    }
    
    // 프로덕션에서는 Cloudflare D1 사용 (추후 구현)
    console.warn('🔧 Cloudflare D1 설정 필요 - 개발 환경 DB 사용');
    const dbPath = path.join(process.cwd(), 'cloudflare-auth.db');
    const sqlite = new Database(dbPath);
    return drizzle(sqlite, { schema });
    
  } catch (error) {
    console.error('❌ Cloudflare DB 연결 실패:', error);
    const sqlite = new Database(':memory:');
    return drizzle(sqlite, { schema });
  }
}



// Cloudflare 최적화된 Better Auth 설정
export const cloudflareAuth = betterAuth({
  database: drizzleAdapter(createCloudflareDB(), {
    provider: 'sqlite',
    schema: {
      user: schema.User,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  
  // 테이블과 필드 매핑 (snake_case 사용) - verification 제외
  user: {
    fields: {
      emailVerified: 'email_verified',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
  session: {
    fields: {
      userId: 'user_id',
      expiresAt: 'expires_at',
      ipAddress: 'ip_address',
      userAgent: 'user_agent',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
  account: {
    fields: {
      userId: 'user_id',
      accountId: 'account_id',
      providerId: 'provider_id',
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
      idToken: 'id_token',
      accessTokenExpiresAt: 'access_token_expires_at',
      refreshTokenExpiresAt: 'refresh_token_expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
  // verification 테이블은 기본 필드명 사용 (camelCase)
  
  // 기본 설정
  secret: process.env.BETTER_AUTH_SECRET || 'cloudflare-auth-secret-key',
  baseURL: process.env.BETTER_AUTH_BASE_URL || 'http://localhost:3000',
  basePath: '/api/auth',
  
  // 이메일/비밀번호 비활성화
  emailAndPassword: {
    enabled: false,
  },
  
  // Google OAuth만 활성화
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "377801534281-012et7rc69lqbo66ojnfmj8u8brd5ols.apps.googleusercontent.com",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "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",
      redirectURI: "http://localhost:3000/api/auth/callback/google",
    },
  },
  
  // Cloudflare 환경 최적화
  trustedOrigins: [
    "http://localhost:3000",
    "*.gameplaza.kr",
    "*.pages.dev", // Cloudflare Pages
  ],
  
  // 세션 설정
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7일
    updateAge: 60 * 60 * 24,     // 1일
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7일
    },
    cookieName: 'better-auth.session_token', // 명시적 쿠키 이름
  },
  
  // Cloudflare Workers 최적화
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
    crossSubDomainCookies: {
      enabled: false,
    },
    useSecureCookies: process.env.NODE_ENV === 'production',
    cookies: {
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
});

// 타입 익스포트
export type CloudflareSession = typeof cloudflareAuth.$Infer.Session;
export type CloudflareUser = typeof cloudflareAuth.$Infer.User;