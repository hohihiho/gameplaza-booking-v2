import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  // Drizzle 스키마 파일의 위치를 지정합니다.
  schema: './lib/db/schema.ts',

  // 마이그레이션 파일이 저장될 폴더입니다.
  out: './drizzle',

  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    token: process.env.CLOUDFLARE_D1_API_TOKEN!,
  },
});