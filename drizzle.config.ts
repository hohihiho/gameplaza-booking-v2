// Drizzle Kit 설정 - Cloudflare D1 전용
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
  driver: 'd1-http', // Cloudflare D1 HTTP API 사용
  
  dbCredentials: {
    // 개발 환경에서는 로컬 SQLite 파일 사용
    url: process.env.NODE_ENV === 'development' 
      ? 'file:./drizzle/dev.db'
      : process.env.DATABASE_URL || '',
    
    // Cloudflare D1 설정 (프로덕션)
    ...(process.env.NODE_ENV === 'production' && {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID,
      token: process.env.CLOUDFLARE_API_TOKEN,
    }),
  },
  
  // 마이그레이션 설정
  verbose: true,
  strict: true,
  
  // D1 특화 설정
  tablesFilter: ['!better_auth_*'], // Better Auth 테이블 제외
});