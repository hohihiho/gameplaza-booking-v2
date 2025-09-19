import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
// import { passkey } from "better-auth/plugins/passkey"; // TODO: 패스키 플러그인 추후 구현
import { getRawDB } from "@/lib/db/server";

// SQLite Date 객체 변환을 위한 래퍼 함수
function createSQLiteWrapper() {
  const rawDB = getRawDB();
  
  // 원본 prepare 함수 저장
  const originalPrepare = rawDB.prepare.bind(rawDB);
  
  // prepare 함수 오버라이드하여 Date 객체 변환
  rawDB.prepare = function(sql: string) {
    const stmt = originalPrepare(sql);
    const originalRun = stmt.run.bind(stmt);
    const originalAll = stmt.all.bind(stmt);
    const originalGet = stmt.get.bind(stmt);
    
    // 파라미터에서 Date 객체를 문자열로 변환하는 함수
    const convertParams = (params: any[]) => {
      return params?.map(p => {
        if (p instanceof Date) {
          console.log('🔄 SQLite Date 변환:', p, '->', p.toISOString());
          return p.toISOString();
        }
        return p;
      });
    };
    
    // run 메서드 오버라이드
    stmt.run = function(...params: any[]) {
      const convertedParams = convertParams(params);
      return originalRun(...(convertedParams || params));
    };
    
    // all 메서드 오버라이드
    stmt.all = function(...params: any[]) {
      const convertedParams = convertParams(params);
      return originalAll(...(convertedParams || params));
    };
    
    // get 메서드 오버라이드
    stmt.get = function(...params: any[]) {
      const convertedParams = convertParams(params);
      return originalGet(...(convertedParams || params));
    };
    
    return stmt;
  };
  
  return rawDB;
}
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { User, session, account, verification } from '@/lib/db/schema';

// 환경 변수 확인
console.log('🔍 Better Auth 환경 변수 상세 확인:', {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '[HIDDEN]' : '❌ 없음',
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ? '[HIDDEN]' : '❌ 없음',
});

// 환경변수 값 직접 할당 (임시 해결책)
const googleClientId = "377801534281-012et7rc69lqbo66ojnfmj8u8brd5ols.apps.googleusercontent.com";
const googleClientSecret = "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";

console.log('🔍 Google OAuth 환경변수 직접 체크:', {
  clientId: googleClientId ? `${googleClientId.substring(0, 10)}...` : '❌ 없음',
  clientSecret: googleClientSecret ? `${googleClientSecret.substring(0, 6)}...` : '❌ 없음',
  clientIdLength: googleClientId?.length || 0,
  clientSecretLength: googleClientSecret?.length || 0,
});

// Better Auth 설정 - SQLite 데이터베이스 사용
export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "development-secret-key-change-in-production",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  
  // SQLite 데이터베이스 연결 (Date 객체 변환 래퍼 포함)
  database: drizzleAdapter(drizzle(getRawDB(), { 
    logger: {
      logQuery: (query, params) => {
        console.log('🔍 Better Auth SQL Query:', query);
        // Date 객체를 ISO 문자열로 변환
        const convertedParams = params?.map(p => {
          if (p instanceof Date) {
            const converted = p.toISOString();
            console.log('🔄 Date 변환:', p, '->', converted);
            return converted;
          }
          return p;
        });
        console.log('🔍 Better Auth SQL Params (변환 후):', convertedParams?.map(p => ({
          value: p,
          type: typeof p,
          isArray: Array.isArray(p),
          isDate: p instanceof Date,
          isNull: p === null,
          isUndefined: p === undefined
        })));
      }
    } 
  }), {
    provider: "sqlite",
    schema: {
      user: User,
      session: session,
      account: account,
      verification: verification,
    },
    // 디버그 모드 활성화
    disableMigrations: false,
    generateId: () => crypto.randomUUID(),
    // 개발 중 디버깅을 위한 추가 로깅
    debug: true,
    // Date 객체 변환 활성화
    transform: {
      date: (value: Date) => value.toISOString()
    }
  }),
  
  // 이메일/비밀번호 로그인 비활성화
  emailAndPassword: {
    enabled: false,
  },
  
  // Google 소셜 로그인
  socialProviders: {
    google: {
      clientId: googleClientId!,
      clientSecret: googleClientSecret!,
      redirectURI: "http://localhost:3000/api/auth/callback/google",
    },
  },
  
  // 추가 설정
  trustedOrigins: ["http://localhost:3000"],
  
  // 플러그인 추가 - 패스키 지원 (추후 구현)
  // plugins: [
  //   passkey({
  //     rpName: "광주 게임플라자",
  //     rpID: process.env.NODE_ENV === "production" ? "gameplaza.kr" : "localhost",
  //     origin: process.env.NODE_ENV === "production" ? "https://gameplaza.kr" : "http://localhost:3000",
  //   }),
  // ],
});

// 타입 내보내기
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;