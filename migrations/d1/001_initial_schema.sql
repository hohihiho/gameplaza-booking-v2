-- D1 초기 스키마 생성
-- SQLite 호환 SQL 사용

-- users 테이블
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  nickname TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user',
  is_blacklisted INTEGER DEFAULT 0,
  marketing_agreed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- admins 테이블
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  is_super_admin INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- device_types 테이블
CREATE TABLE IF NOT EXISTS device_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  max_units INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- devices 테이블
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  type_id TEXT NOT NULL,
  device_number INTEGER NOT NULL,
  status TEXT DEFAULT 'available',
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (type_id) REFERENCES device_types(id)
);

-- reservations 테이블
CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  units INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  amount INTEGER DEFAULT 0,
  adjusted_amount INTEGER,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (device_id) REFERENCES devices(id)
);

-- holidays 테이블
CREATE TABLE IF NOT EXISTS holidays (
  id TEXT PRIMARY KEY,
  date TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'custom',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- schedule_events 테이블
CREATE TABLE IF NOT EXISTS schedule_events (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- reservation_rules 테이블
CREATE TABLE IF NOT EXISTS reservation_rules (
  id TEXT PRIMARY KEY,
  rule_type TEXT NOT NULL,
  rule_key TEXT NOT NULL,
  rule_value TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- machine_rules 테이블
CREATE TABLE IF NOT EXISTS machine_rules (
  id TEXT PRIMARY KEY,
  device_type_id TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  rule_value TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (device_type_id) REFERENCES device_types(id)
);

-- banned_words 테이블
CREATE TABLE IF NOT EXISTS banned_words (
  id TEXT PRIMARY KEY,
  word TEXT UNIQUE NOT NULL,
  category TEXT,
  severity TEXT DEFAULT 'medium',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- time_adjustments 테이블
CREATE TABLE IF NOT EXISTS time_adjustments (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL,
  admin_id TEXT NOT NULL,
  original_start_time TEXT NOT NULL,
  original_end_time TEXT NOT NULL,
  new_start_time TEXT NOT NULL,
  new_end_time TEXT NOT NULL,
  reason TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (reservation_id) REFERENCES reservations(id),
  FOREIGN KEY (admin_id) REFERENCES admins(id)
);

-- amount_adjustments 테이블
CREATE TABLE IF NOT EXISTS amount_adjustments (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL,
  admin_id TEXT NOT NULL,
  original_amount INTEGER NOT NULL,
  new_amount INTEGER NOT NULL,
  reason TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (reservation_id) REFERENCES reservations(id),
  FOREIGN KEY (admin_id) REFERENCES admins(id)
);

-- push_subscriptions 테이블
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_device_id ON reservations(device_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_devices_type_id ON devices(type_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_schedule_events_date ON schedule_events(date);