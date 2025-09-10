import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { sql as sqlQuery } from 'drizzle-orm'
import * as dotenv from 'dotenv'
import * as path from 'path'

// 환경변수 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// PostgreSQL 연결 (Supabase)
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.nymgkiatkfoziluqiijw:UlAdCpnZHRK1ymOk@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require'
console.log('🔗 연결 중:', connectionString.substring(0, 50) + '...')
const sql = postgres(connectionString)
const db = drizzle(sql)

async function setupBetterAuthTables() {
  console.log('🔧 Better Auth 테이블 생성 시작...')
  
  try {
    // users 테이블 생성
    await db.execute(sqlQuery`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        role TEXT DEFAULT 'user',
        phone TEXT,
        profile_image_url TEXT,
        marketing_consent INTEGER DEFAULT 0,
        marketing_agreed INTEGER DEFAULT 0,
        push_notifications_enabled INTEGER DEFAULT 0,
        last_login_at BIGINT
      )
    `)
    console.log('✅ users 테이블 생성 완료')

    // sessions 테이블 생성
    await db.execute(sqlQuery`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMP NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ sessions 테이블 생성 완료')

    // accounts 테이블 생성
    await db.execute(sqlQuery`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        expires_at BIGINT,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(provider, provider_account_id)
      )
    `)
    console.log('✅ accounts 테이블 생성 완료')

    // verifications 테이블 생성
    await db.execute(sqlQuery`
      CREATE TABLE IF NOT EXISTS verifications (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ verifications 테이블 생성 완료')

    // passkeys 테이블 생성 (passkey 플러그인용)
    await db.execute(sqlQuery`
      CREATE TABLE IF NOT EXISTS passkeys (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        credential_id TEXT NOT NULL UNIQUE,
        public_key TEXT NOT NULL,
        counter BIGINT DEFAULT 0,
        device_type TEXT,
        backed_up BOOLEAN DEFAULT FALSE,
        transports TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ passkeys 테이블 생성 완료')

    // organizations 테이블 생성 (organization 플러그인용)
    await db.execute(sqlQuery`
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE,
        logo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ organizations 테이블 생성 완료')

    // members 테이블 생성 (organization 플러그인용)
    await db.execute(sqlQuery`
      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'member',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, organization_id)
      )
    `)
    console.log('✅ members 테이블 생성 완료')

    // two_factor 테이블 생성 (twoFactor 플러그인용)
    await db.execute(sqlQuery`
      CREATE TABLE IF NOT EXISTS two_factor (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        secret TEXT NOT NULL,
        backup_codes TEXT,
        enabled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ two_factor 테이블 생성 완료')

    console.log('🎉 모든 Better Auth 테이블 생성 완료!')
    
  } catch (error) {
    console.error('❌ 테이블 생성 중 오류 발생:', error)
    throw error
  } finally {
    await sql.end()
  }
}

// 스크립트 실행
setupBetterAuthTables()
  .then(() => {
    console.log('✨ 스크립트 실행 완료')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 스크립트 실행 실패:', error)
    process.exit(1)
  })