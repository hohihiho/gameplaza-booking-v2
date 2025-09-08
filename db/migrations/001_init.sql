-- GamePlaza V2 D1 Database Schema
-- SQLite-based schema for Cloudflare D1

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  nickname TEXT,
  image TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('user', 'admin', 'super_admin')) DEFAULT 'user',
  email_verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Sessions table for Better Auth
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Accounts table for OAuth providers
CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at TEXT,
  refresh_token_expires_at TEXT,
  scope TEXT,
  password TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Device types table
CREATE TABLE IF NOT EXISTS device_types (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  rental_settings TEXT DEFAULT '{}', -- JSON string
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  device_type_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('available', 'occupied', 'maintenance', 'reserved')) DEFAULT 'available',
  position INTEGER,
  last_used_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (device_type_id) REFERENCES device_types(id) ON DELETE CASCADE
);

-- Rental time slots table
CREATE TABLE IF NOT EXISTS rental_time_slots (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  device_type_id TEXT NOT NULL,
  slot_type TEXT CHECK (slot_type IN ('early', 'overnight')) NOT NULL,
  start_time TEXT NOT NULL, -- HH:MM format
  end_time TEXT NOT NULL,   -- HH:MM format
  credit_options TEXT DEFAULT '[]', -- JSON string
  enable_2p INTEGER DEFAULT 0,
  price_2p_extra INTEGER,
  is_youth_time INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (device_type_id) REFERENCES device_types(id) ON DELETE CASCADE
);

-- Rental settings table
CREATE TABLE IF NOT EXISTS rental_settings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  device_type_id TEXT NOT NULL UNIQUE,
  max_rental_units INTEGER,
  min_rental_hours INTEGER DEFAULT 1,
  max_rental_hours INTEGER DEFAULT 24,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (device_type_id) REFERENCES device_types(id) ON DELETE CASCADE
);

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  device_type_id TEXT NOT NULL,
  device_id TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration_hours INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  credit_type TEXT,
  credit_amount INTEGER,
  is_2p INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')) DEFAULT 'pending',
  check_in_time TEXT,
  check_out_time TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (device_type_id) REFERENCES device_types(id) ON DELETE CASCADE,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL
);

-- Guide content table
CREATE TABLE IF NOT EXISTS guide_content (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('general', 'reservation', 'device', 'policy')) DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Reservation rules table
CREATE TABLE IF NOT EXISTS reservation_rules (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT CHECK (type IN ('general', 'time', 'payment', 'cancellation')) DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_session_user_id ON session(user_id);
CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
CREATE INDEX IF NOT EXISTS idx_account_user_id ON account(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_device_type ON devices(device_type_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_rental_time_slots_device_type ON rental_time_slots(device_type_id);
CREATE INDEX IF NOT EXISTS idx_rental_time_slots_slot_type ON rental_time_slots(slot_type);
CREATE INDEX IF NOT EXISTS idx_rental_settings_device_type ON rental_settings(device_type_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_device_type ON reservations(device_type_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_time ON reservations(start_time, end_time);

-- Triggers for updated_at columns
CREATE TRIGGER IF NOT EXISTS update_users_updated_at
  AFTER UPDATE ON users
  BEGIN
    UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_session_updated_at
  AFTER UPDATE ON session
  BEGIN
    UPDATE session SET updated_at = datetime('now') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_account_updated_at
  AFTER UPDATE ON account
  BEGIN
    UPDATE account SET updated_at = datetime('now') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_device_types_updated_at
  AFTER UPDATE ON device_types
  BEGIN
    UPDATE device_types SET updated_at = datetime('now') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_devices_updated_at
  AFTER UPDATE ON devices
  BEGIN
    UPDATE devices SET updated_at = datetime('now') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_rental_time_slots_updated_at
  AFTER UPDATE ON rental_time_slots
  BEGIN
    UPDATE rental_time_slots SET updated_at = datetime('now') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_rental_settings_updated_at
  AFTER UPDATE ON rental_settings
  BEGIN
    UPDATE rental_settings SET updated_at = datetime('now') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_reservations_updated_at
  AFTER UPDATE ON reservations
  BEGIN
    UPDATE reservations SET updated_at = datetime('now') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_guide_content_updated_at
  AFTER UPDATE ON guide_content
  BEGIN
    UPDATE guide_content SET updated_at = datetime('now') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_reservation_rules_updated_at
  AFTER UPDATE ON reservation_rules
  BEGIN
    UPDATE reservation_rules SET updated_at = datetime('now') WHERE id = NEW.id;
  END;