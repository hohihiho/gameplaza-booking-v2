-- Better Auth 전용 스키마 (완전히 새로 작성)
-- SQLite D1 호환

CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" INTEGER DEFAULT 0, -- SQLite에서는 BOOLEAN 대신 INTEGER 사용
  "name" TEXT,
  "image" TEXT,
  "createdAt" INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  "updatedAt" INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  -- 게임플라자 전용 필드
  "nickname" TEXT,
  "phone" TEXT,
  "role" TEXT NOT NULL DEFAULT 'user', -- 'user', 'admin', 'super_admin'
  "isActive" INTEGER NOT NULL DEFAULT 1,
  "lastLoginAt" INTEGER
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" TEXT PRIMARY KEY,
  "expiresAt" INTEGER NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "createdAt" INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  "updatedAt" INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" TEXT PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" INTEGER,
  "refreshTokenExpiresAt" INTEGER,
  "scope" TEXT,
  "password" TEXT,
  "createdAt" INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  "updatedAt" INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" TEXT PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" INTEGER NOT NULL,
  "createdAt" INTEGER DEFAULT (strftime('%s', 'now')),
  "updatedAt" INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS "user_email_idx" ON "user"("email");
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session"("userId");
CREATE INDEX IF NOT EXISTS "session_token_idx" ON "session"("token");
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account"("userId");
CREATE INDEX IF NOT EXISTS "account_providerId_idx" ON "account"("providerId");
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification"("identifier");