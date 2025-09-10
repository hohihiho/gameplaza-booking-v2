import { getDB } from "@/lib/db/server"
import { sql } from "drizzle-orm"

async function setupBetterAuthTables() {
  console.log('🔧 Better Auth 테이블 생성 시작...')
  
  const db = getDB()
  
  try {
    // users 테이블 생성
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE NOT NULL,
        email_verified INTEGER DEFAULT 0,
        image TEXT,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch()),
        role TEXT DEFAULT 'user',
        phone TEXT,
        profile_image_url TEXT,
        marketing_consent INTEGER DEFAULT 0,
        marketing_agreed INTEGER DEFAULT 0,
        push_notifications_enabled INTEGER DEFAULT 0,
        last_login_at INTEGER
      )
    `)
    console.log('✅ users 테이블 생성 완료')

    // sessions 테이블 생성
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch()),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)
    console.log('✅ sessions 테이블 생성 완료')

    // accounts 테이블 생성
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch()),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(provider, provider_account_id)
      )
    `)
    console.log('✅ accounts 테이블 생성 완료')

    // verifications 테이블 생성
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS verifications (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      )
    `)
    console.log('✅ verifications 테이블 생성 완료')

    // passkeys 테이블 생성 (passkey 플러그인용)
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS passkeys (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        credential_id TEXT NOT NULL UNIQUE,
        public_key TEXT NOT NULL,
        counter INTEGER DEFAULT 0,
        device_type TEXT,
        backed_up INTEGER DEFAULT 0,
        transports TEXT,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch()),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)
    console.log('✅ passkeys 테이블 생성 완료')

    // organizations 테이블 생성 (organization 플러그인용)
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE,
        logo TEXT,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      )
    `)
    console.log('✅ organizations 테이블 생성 완료')

    // members 테이블 생성 (organization 플러그인용)
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        organization_id TEXT NOT NULL,
        role TEXT DEFAULT 'member',
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch()),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        UNIQUE(user_id, organization_id)
      )
    `)
    console.log('✅ members 테이블 생성 완료')

    // two_factor 테이블 생성 (twoFactor 플러그인용)
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS two_factor (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        secret TEXT NOT NULL,
        backup_codes TEXT,
        enabled INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch()),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)
    console.log('✅ two_factor 테이블 생성 완료')

    console.log('🎉 모든 Better Auth 테이블 생성 완료!')
    
  } catch (error) {
    console.error('❌ 테이블 생성 중 오류 발생:', error)
    throw error
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