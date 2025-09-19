-- 초기 데이터베이스 스키마 생성
-- Better Auth + Cloudflare D1용

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  profile_image_url TEXT,
  marketing_consent INTEGER DEFAULT 0,
  marketing_agreed INTEGER DEFAULT 0,
  push_notifications_enabled INTEGER DEFAULT 0,
  last_login_at INTEGER,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Better Auth 계정 테이블
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at TEXT,
  refresh_token_expires_at TEXT,
  scope TEXT,
  password TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_provider ON accounts(provider_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_account_provider ON accounts(account_id, provider_id);

-- 세션 테이블
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 인증 테이블
CREATE TABLE IF NOT EXISTS verifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_verifications_identifier ON verifications(identifier);
CREATE INDEX IF NOT EXISTS idx_verifications_value ON verifications(value);

-- 기기 카테고리 테이블
CREATE TABLE IF NOT EXISTS device_categories (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 기기 타입 테이블
CREATE TABLE IF NOT EXISTS device_types (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  hourly_rate INTEGER NOT NULL DEFAULT 0,
  daily_max_hours INTEGER DEFAULT 8,
  requires_approval INTEGER DEFAULT 0,
  icon_url TEXT,
  category_id TEXT REFERENCES device_categories(id),
  model_name TEXT,
  version_name TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_rentable INTEGER NOT NULL DEFAULT 1,
  play_modes TEXT,
  rental_settings TEXT,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
);

-- 기기 테이블
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  device_type_id TEXT NOT NULL REFERENCES device_types(id),
  device_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'occupied', 'maintenance', 'offline')),
  location TEXT,
  serial_number TEXT,
  specifications TEXT,
  notes TEXT,
  last_maintenance INTEGER,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(device_type_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_name ON devices(name);

-- 예약 테이블
CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id),
  device_id TEXT NOT NULL REFERENCES devices(id),
  start_time INTEGER NOT NULL,
  end_time INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show')),
  total_amount INTEGER DEFAULT 0,
  notes TEXT,
  admin_notes TEXT,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_device ON reservations(device_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_time ON reservations(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at);

-- 체크인 테이블
CREATE TABLE IF NOT EXISTS checkins (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  reservation_id TEXT NOT NULL UNIQUE REFERENCES reservations(id),
  checked_in_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  checked_out_at INTEGER,
  actual_end_time INTEGER,
  overtime_minutes INTEGER DEFAULT 0,
  additional_charges INTEGER DEFAULT 0,
  notes TEXT,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_checkins_reservation ON checkins(reservation_id);

-- 일정 테이블
CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  date TEXT NOT NULL,
  day_of_week INTEGER NOT NULL,
  is_holiday INTEGER DEFAULT 0,
  is_special_day INTEGER DEFAULT 0,
  open_time TEXT NOT NULL DEFAULT '10:00',
  close_time TEXT NOT NULL DEFAULT '22:00',
  notes TEXT,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_schedules_day_of_week ON schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_schedules_holiday ON schedules(is_holiday);

-- 일정 이벤트 테이블
CREATE TABLE IF NOT EXISTS schedule_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('early_open', 'overnight', 'special')),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_auto_generated INTEGER DEFAULT 0,
  source_type TEXT,
  source_reference TEXT,
  title TEXT,
  description TEXT,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_schedule_events_date ON schedule_events(date);
CREATE INDEX IF NOT EXISTS idx_schedule_events_type ON schedule_events(type);
CREATE INDEX IF NOT EXISTS idx_schedule_events_date_type ON schedule_events(date, type);
CREATE INDEX IF NOT EXISTS idx_schedule_events_auto_generated ON schedule_events(is_auto_generated);

-- 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  metadata TEXT,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- 금지어 테이블
CREATE TABLE IF NOT EXISTS banned_words (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  word TEXT NOT NULL UNIQUE,
  category TEXT DEFAULT 'general',
  severity INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP
);

-- 결제 테이블
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  reservation_id TEXT REFERENCES reservations(id),
  amount INTEGER NOT NULL,
  method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id TEXT,
  metadata TEXT,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_reservation ON payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 관리자 테이블
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('admin', 'super_admin')),
  permissions TEXT,
  is_super_admin INTEGER DEFAULT 0,
  bank_account TEXT,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_user ON admins(user_id);

-- 결제 계좌 테이블
CREATE TABLE IF NOT EXISTS payment_accounts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  is_primary INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_accounts_primary ON payment_accounts(is_primary);
CREATE INDEX IF NOT EXISTS idx_payment_accounts_active ON payment_accounts(is_active);

-- 푸시 구독 테이블
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_email TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT,
  auth TEXT,
  user_agent TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_email ON push_subscriptions(user_email);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_enabled ON push_subscriptions(enabled);

-- 컨텐츠 페이지 테이블
CREATE TABLE IF NOT EXISTS content_pages (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'markdown',
  version INTEGER DEFAULT 1,
  is_published INTEGER DEFAULT 1,
  published_at TEXT,
  metadata TEXT,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_pages_slug ON content_pages(slug);
CREATE INDEX IF NOT EXISTS idx_content_pages_published ON content_pages(is_published);

-- 약관 테이블 (이용약관, 개인정보처리방침 등)
CREATE TABLE IF NOT EXISTS terms (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  type TEXT NOT NULL CHECK(type IN ('terms_of_service', 'privacy_policy', 'service_rules', 'usage_guide')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  is_active INTEGER DEFAULT 1,
  effective_date TEXT,
  metadata TEXT,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_terms_type ON terms(type);
CREATE INDEX IF NOT EXISTS idx_terms_active ON terms(is_active);
CREATE INDEX IF NOT EXISTS idx_terms_effective_date ON terms(effective_date);