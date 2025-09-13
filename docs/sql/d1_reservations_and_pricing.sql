-- Cloudflare D1 schema for reservations and device_pricing
-- Execute this file in your D1 instance prior to enabling D1 in the app.

-- Users (directory)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'active', -- 'active' | 'suspended'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- User roles (6단계 권한 포함 가능)
CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL,
  role_type TEXT NOT NULL CHECK (role_type IN (
    'super_admin',   -- 슈퍼관리자
    'gp_vip',        -- 겜플VIP
    'gp_regular',    -- 겜플단골
    'gp_user',       -- 겜플유저(일반)
    'restricted'     -- 제한(예약 금지)
  )),
  granted_at TEXT NOT NULL,
  granted_by TEXT,
  PRIMARY KEY (user_id, role_type)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles (user_id);

-- User restrictions (예약 제한/정지)
CREATE TABLE IF NOT EXISTS user_restrictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  restriction_type TEXT NOT NULL CHECK (restriction_type IN ('normal','restricted','suspended')),
  reason TEXT,
  start_date TEXT,
  end_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by TEXT,
  is_active INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_user_restrictions_user ON user_restrictions (user_id);

-- OAuth identities (재가입 방지용 식별자 저장)
CREATE TABLE IF NOT EXISTS oauth_identities (
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'google' 등
  subject TEXT NOT NULL,  -- provider 고유 sub
  email_hash TEXT,        -- 선택: 이메일 해시(SHA256 등)
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (provider, subject)
);

-- Blocked identities (블랙리스트: 재가입 방지)
CREATE TABLE IF NOT EXISTS blocked_identities (
  provider TEXT NOT NULL,
  subject TEXT,        -- 둘 중 하나 이상 세팅
  email_hash TEXT,
  reason TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by TEXT,
  PRIMARY KEY (provider, subject, email_hash)
);

-- Age verification
CREATE TABLE IF NOT EXISTS age_verifications (
  user_id TEXT PRIMARY KEY,
  is_verified INTEGER NOT NULL DEFAULT 0,
  verified_at TEXT,
  verified_by TEXT,
  method TEXT -- e.g., 'manual', 'id_check'
);

-- Web Push subscriptions (client)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  user_id TEXT PRIMARY KEY,
  subscription TEXT NOT NULL, -- JSON
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Notification logs
CREATE TABLE IF NOT EXISTS push_notification_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  type TEXT,
  title TEXT,
  body TEXT,
  data TEXT,
  status TEXT,
  error TEXT,
  sent_at TEXT
);

-- Device types (catalog)
CREATE TABLE IF NOT EXISTS device_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  is_rentable INTEGER NOT NULL DEFAULT 0,
  max_rentable_count INTEGER NOT NULL DEFAULT 1,
  color_code TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_device_types_name ON device_types (name);

-- Rental time blocks (availability windows per device type, not pricing)
CREATE TABLE IF NOT EXISTS rental_time_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_type_id INTEGER NOT NULL,
  slot_type TEXT CHECK (slot_type IN ('early','overnight')) NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  enable_extra_people INTEGER NOT NULL DEFAULT 0,
  extra_per_person INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_time_blocks_device ON rental_time_blocks (device_type_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_slot ON rental_time_blocks (slot_type);

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  device_id       TEXT NOT NULL,
  date            TEXT NOT NULL,
  start_time      TEXT NOT NULL,
  end_time        TEXT NOT NULL,
  player_count    INTEGER NOT NULL DEFAULT 1,
  credit_type     TEXT NOT NULL,
  fixed_credits   INTEGER,
  total_amount    INTEGER NOT NULL DEFAULT 0,
  user_notes      TEXT,
  slot_type       TEXT NOT NULL,
  status          TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  check_in_at     TEXT,
  payment_method  TEXT CHECK (payment_method IN ('cash','transfer')),
  payment_amount  INTEGER,
  payment_status  TEXT CHECK (payment_status IN ('pending','paid')),
  payment_confirmed_at TEXT,
  payment_confirmed_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations (date);
CREATE INDEX IF NOT EXISTS idx_reservations_device_date ON reservations (device_id, date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations (status);

-- Device pricing table (preferred pricing source)
CREATE TABLE IF NOT EXISTS device_pricing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_type_id INTEGER NOT NULL,
  option_type TEXT CHECK (option_type IN ('fixed','freeplay','unlimited')) NOT NULL,
  price INTEGER NOT NULL,
  price_2p_extra INTEGER,
  enable_extra_people INTEGER NOT NULL DEFAULT 0,
  extra_per_person INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_device_pricing_type ON device_pricing (device_type_id);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_device_pricing_option ON device_pricing (device_type_id, option_type);

-- Schedule events (operations schedule)
CREATE TABLE IF NOT EXISTS schedule_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  end_date TEXT,
  type TEXT CHECK (type IN ('special','early_open','overnight','early_close','event','reservation_block')) NOT NULL,
  start_time TEXT,
  end_time TEXT,
  affects_reservation INTEGER DEFAULT 0 NOT NULL,
  block_type TEXT CHECK (block_type IN ('early','overnight','all_day')),
  is_auto_generated INTEGER DEFAULT 0 NOT NULL,
  source_type TEXT CHECK (source_type IN ('manual','reservation_auto')),
  source_reference INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_schedule_events_date ON schedule_events (date);
CREATE INDEX IF NOT EXISTS idx_schedule_events_type ON schedule_events (type);
CREATE INDEX IF NOT EXISTS idx_schedule_events_affects_reservation ON schedule_events (affects_reservation);
CREATE INDEX IF NOT EXISTS idx_schedule_events_auto_generated ON schedule_events (is_auto_generated);

-- CMS: Terms pages (versioned)
CREATE TABLE IF NOT EXISTS terms_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('terms_of_service','privacy_policy','marketing','age_confirm')),
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_terms_pages_type ON terms_pages (type);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_terms_type_version ON terms_pages (type, version);
CREATE INDEX IF NOT EXISTS idx_terms_pages_active ON terms_pages (type, is_active);

-- CMS: Guide categories and contents
CREATE TABLE IF NOT EXISTS guide_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  icon TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS guide_contents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_published INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_guide_contents_category ON guide_contents (category_id);
CREATE INDEX IF NOT EXISTS idx_guide_contents_published ON guide_contents (is_published);

-- Admin payment QR (per superadmin)
CREATE TABLE IF NOT EXISTS payment_qr_codes (
  admin_user_id TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Moderation: banned words (manual list)
CREATE TABLE IF NOT EXISTS banned_words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL UNIQUE,
  category TEXT CHECK (category IN ('profanity','spam','custom','sensitive')) NOT NULL DEFAULT 'custom',
  severity TEXT CHECK (severity IN ('low','medium','high')) NOT NULL DEFAULT 'medium',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_banned_words_active ON banned_words (is_active);

-- Push notification templates
CREATE TABLE IF NOT EXISTS push_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data TEXT, -- JSON payload
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Optional sample seed (replace :device_type_id with real ID)
-- INSERT INTO device_pricing (device_type_id, option_type, price, price_2p_extra, enable_extra_people, extra_per_person)
-- VALUES
--   (:device_type_id, 'fixed',     25000, 5000,  1, 3000),
--   (:device_type_id, 'freeplay',  30000, 5000,  1, 3000),
--   (:device_type_id, 'unlimited', 35000, 5000,  1, 3000);
