-- Cloudflare D1 schema for device catalog used by Machines page

-- Device categories
CREATE TABLE IF NOT EXISTS device_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- Device types (if not created elsewhere)
CREATE TABLE IF NOT EXISTS device_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  category_id INTEGER,
  is_rentable INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  model_name TEXT,
  version_name TEXT,
  description TEXT,
  rental_settings TEXT, -- JSON string
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Devices (individual machines)
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  device_type_id INTEGER NOT NULL,
  device_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'available', -- available | in_use | maintenance | reserved | broken
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_devices_type ON devices (device_type_id);

-- Play modes (per device type pricing overview for UI)
CREATE TABLE IF NOT EXISTS play_modes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_type_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_play_modes_type ON play_modes (device_type_id);

-- Machine rules (public notice list on Machines page)
CREATE TABLE IF NOT EXISTS machine_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0
);

