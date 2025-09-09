-- Phone 필드 제거 마이그레이션
-- 전화번호 필드가 더 이상 필요하지 않으므로 users 테이블에서 제거

-- SQLite는 ALTER TABLE DROP COLUMN을 지원하지 않으므로 
-- 테이블을 재생성해야 합니다

-- 1. 임시 테이블 생성 (phone 필드 없이)
CREATE TABLE users_new (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  profileImageUrl TEXT,
  marketingConsent INTEGER DEFAULT 0,
  marketing_agreed INTEGER DEFAULT 0,
  push_notifications_enabled INTEGER DEFAULT 0,
  lastLoginAt INTEGER,
  createdAt INTEGER DEFAULT CURRENT_TIMESTAMP,
  updatedAt INTEGER DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

-- 2. 기존 데이터 복사 (phone 필드 제외)
INSERT INTO users_new (
  id, email, name, role, profileImageUrl, 
  marketingConsent, marketing_agreed, push_notifications_enabled,
  lastLoginAt, createdAt, updatedAt, updated_at
)
SELECT 
  id, email, name, role, profileImageUrl,
  marketingConsent, marketing_agreed, push_notifications_enabled,
  lastLoginAt, createdAt, updatedAt, updated_at
FROM users;

-- 3. 기존 테이블 삭제
DROP TABLE users;

-- 4. 새 테이블 이름 변경
ALTER TABLE users_new RENAME TO users;

-- 5. 인덱스 재생성
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(createdAt);