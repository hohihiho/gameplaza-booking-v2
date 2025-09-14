-- Master migration for Cloudflare D1 (squashed)
-- Creates catalog + reservations/pricing + alters + seeds (rhythm games)

-- ===== Catalog =====
CREATE TABLE IF NOT EXISTS device_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS device_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  category_id INTEGER,
  is_rentable INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  model_name TEXT,
  version_name TEXT,
  description TEXT,
  rental_settings TEXT,
  max_rentable_count INTEGER,
  color_code TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  device_type_id INTEGER NOT NULL,
  device_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_devices_type ON devices (device_type_id);

CREATE TABLE IF NOT EXISTS play_modes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_type_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_play_modes_type ON play_modes (device_type_id);

CREATE TABLE IF NOT EXISTS machine_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- ===== Reservations & Pricing =====
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL,
  role_type TEXT NOT NULL,
  granted_at TEXT NOT NULL,
  granted_by TEXT,
  PRIMARY KEY (user_id, role_type)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles (user_id);

CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  player_count INTEGER NOT NULL DEFAULT 1,
  credit_type TEXT NOT NULL,
  fixed_credits INTEGER,
  total_amount INTEGER NOT NULL DEFAULT 0,
  user_notes TEXT,
  slot_type TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  check_in_at TEXT,
  payment_method TEXT,
  payment_amount INTEGER,
  payment_status TEXT,
  payment_confirmed_at TEXT,
  payment_confirmed_by TEXT,
  reservation_number TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_reservations_reservation_number ON reservations (reservation_number);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations (date);
CREATE INDEX IF NOT EXISTS idx_reservations_device_date ON reservations (device_id, date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations (status);

CREATE TABLE IF NOT EXISTS rental_time_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_type_id INTEGER NOT NULL,
  slot_type TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  enable_extra_people INTEGER NOT NULL DEFAULT 0,
  extra_per_person INTEGER,
  is_youth_time INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_time_blocks_device ON rental_time_blocks (device_type_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_slot ON rental_time_blocks (slot_type);

CREATE TABLE IF NOT EXISTS device_pricing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_type_id INTEGER NOT NULL,
  option_type TEXT NOT NULL,
  price INTEGER NOT NULL,
  price_2p_extra INTEGER,
  enable_extra_people INTEGER NOT NULL DEFAULT 0,
  extra_per_person INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_device_pricing_type ON device_pricing (device_type_id);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_device_pricing_option ON device_pricing (device_type_id, option_type);

-- ===== Rhythm Games Seed =====
INSERT OR IGNORE INTO device_types (id, name, is_rentable, display_order, model_name, version_name, description, rental_settings)
VALUES
  (1001, 'CHUNITHM', 1, 1, 'SEGA', NULL, '츄니즘', '{"display_order":1,"max_rental_units":3,"max_players":2}'),
  (1002, 'maimai', 1, 2, 'SEGA', NULL, '마이마이', '{"display_order":2,"max_rental_units":3,"max_players":2}'),
  (1003, 'SOUND VOLTEX', 1, 3, 'Valkyrie', NULL, '사볼 발키리 모델', '{"display_order":3,"max_rental_units":3,"max_players":1}'),
  (1004, 'beatmania IIDX', 1, 4, 'Lightning', NULL, '비매 라이트닝 모델', '{"display_order":4,"max_rental_units":2,"max_players":2}');

INSERT OR IGNORE INTO device_types (id, name, is_rentable, display_order, model_name, version_name, description, rental_settings)
VALUES
  (1103, 'SOUND VOLTEX (Legacy)', 1, 13, 'KONAMI', 'Old (legacy)', '사운드볼텍스 구기체', '{"display_order":13,"max_rental_units":2,"max_players":1}'),
  (1104, 'beatmania IIDX (Legacy)', 1, 14, 'KONAMI', 'Old (legacy)', '비트매니아 구기체', '{"display_order":14,"max_rental_units":2,"max_players":2}');

INSERT OR IGNORE INTO device_types (id, name, is_rentable, display_order, model_name, version_name, description, rental_settings)
VALUES
  (1201, 'jubeat', 1, 21, 'KONAMI', NULL, '유비트', '{"display_order":21,"max_rental_units":4,"max_players":2}'),
  (1202, 'pop''n music', 1, 22, 'KONAMI', NULL, '팝픈', '{"display_order":22,"max_rental_units":2,"max_players":2}'),
  (1203, 'GITADORA Guitar', 1, 23, 'Arena', NULL, '기타도라 기타(아레나)', '{"display_order":23,"max_rental_units":2,"max_players":1}'),
  (1204, 'GITADORA Drum', 1, 24, 'Arena', NULL, '기타도라 드럼(아레나)', '{"display_order":24,"max_rental_units":2,"max_players":1}'),
  (1205, 'DJMAX TECHNIKA', 1, 25, 'Pentavision', NULL, '테크니카', '{"display_order":25,"max_rental_units":1,"max_players":2}'),
  (1206, 'Taiko no Tatsujin', 1, 26, 'BANDAI NAMCO', NULL, '태고의 달인', '{"display_order":26,"max_rental_units":2,"max_players":2}'),
  (1207, 'EZ2DJ', 1, 27, 'Square Pixels', NULL, '이지투디제이', '{"display_order":27,"max_rental_units":2,"max_players":2}'),
  (1208, 'REFLEC BEAT', 1, 28, 'KONAMI', NULL, '리플렉비트', '{"display_order":28,"max_rental_units":2,"max_players":2}'),
  (1209, 'NOSTALGIA', 1, 29, 'KONAMI', NULL, '노스텔지어', '{"display_order":29,"max_rental_units":2,"max_players":2}'),
  (1210, 'DanceDanceRevolution', 1, 30, 'KONAMI', NULL, 'DDR', '{"display_order":30,"max_rental_units":2,"max_players":2}'),
  (1211, 'PUMP IT UP', 1, 31, 'Andamiro', NULL, '펌프', '{"display_order":31,"max_rental_units":2,"max_players":2}'),
  (1212, 'WACCA', 1, 32, 'Marvelous', NULL, '왓카', '{"display_order":32,"max_rental_units":1,"max_players":2}');

INSERT OR IGNORE INTO devices (id, device_type_id, device_number, status) VALUES
  ('00000000-0000-0000-0000-000000100101', 1001, 1, 'available'),
  ('00000000-0000-0000-0000-000000100102', 1001, 2, 'available'),
  ('00000000-0000-0000-0000-000000100103', 1001, 3, 'available'),
  ('00000000-0000-0000-0000-000000100201', 1002, 1, 'available'),
  ('00000000-0000-0000-0000-000000100202', 1002, 2, 'available'),
  ('00000000-0000-0000-0000-000000100203', 1002, 3, 'available'),
  ('00000000-0000-0000-0000-000000100204', 1002, 4, 'available'),
  ('00000000-0000-0000-0000-000000100301', 1003, 1, 'available'),
  ('00000000-0000-0000-0000-000000100302', 1003, 2, 'available'),
  ('00000000-0000-0000-0000-000000100303', 1003, 3, 'available'),
  ('00000000-0000-0000-0000-000000100304', 1003, 4, 'available'),
  ('00000000-0000-0000-0000-000000100305', 1003, 5, 'available'),
  ('00000000-0000-0000-0000-000000100306', 1003, 6, 'available'),
  ('00000000-0000-0000-0000-000000100307', 1003, 7, 'available'),
  ('00000000-0000-0000-0000-000000100308', 1003, 8, 'available'),
  ('00000000-0000-0000-0000-000000100309', 1003, 9, 'available'),
  ('00000000-0000-0000-0000-00000010030A', 1003, 10, 'available'),
  ('00000000-0000-0000-0000-00000010030B', 1003, 11, 'available'),
  ('00000000-0000-0000-0000-00000010030C', 1003, 12, 'available'),
  ('00000000-0000-0000-0000-00000010030D', 1003, 13, 'available'),
  ('00000000-0000-0000-0000-000000100401', 1004, 1, 'available');

INSERT OR IGNORE INTO rental_time_blocks (device_type_id, slot_type, start_time, end_time, enable_extra_people, extra_per_person, is_youth_time) VALUES
  (1001, 'early', '07:00:00', '12:00:00', 0, NULL, 0),
  (1001, 'early', '08:00:00', '12:00:00', 0, NULL, 0),
  (1001, 'early', '09:00:00', '13:00:00', 0, NULL, 1),
  (1001, 'overnight', '24:00:00', '28:00:00', 0, NULL, 0),
  (1002, 'early', '07:00:00', '12:00:00', 1, 10000, 0),
  (1002, 'early', '08:00:00', '12:00:00', 1, 10000, 0),
  (1002, 'early', '09:00:00', '13:00:00', 1, 10000, 1),
  (1002, 'overnight', '24:00:00', '28:00:00', 1, 10000, 0),
  (1003, 'early', '07:00:00', '12:00:00', 0, NULL, 0),
  (1003, 'early', '08:00:00', '12:00:00', 0, NULL, 0),
  (1003, 'early', '09:00:00', '13:00:00', 0, NULL, 1),
  (1003, 'overnight', '24:00:00', '29:00:00', 0, NULL, 0),
  (1004, 'early', '07:00:00', '12:00:00', 0, NULL, 0),
  (1004, 'early', '08:00:00', '12:00:00', 0, NULL, 0),
  (1004, 'early', '09:00:00', '13:00:00', 0, NULL, 1),
  (1004, 'overnight', '24:00:00', '29:00:00', 0, NULL, 0);

