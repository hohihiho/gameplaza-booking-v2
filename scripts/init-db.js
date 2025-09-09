const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'dev.db');
const db = new Database(DB_PATH);

console.log('데이터베이스 초기화 시작...');

// 테이블 생성
db.exec(`
  -- 사용자 테이블
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'user',
    profile_image TEXT,
    marketing_consent INTEGER DEFAULT 0,
    marketing_agreed INTEGER DEFAULT 0,
    push_notifications_enabled INTEGER DEFAULT 0,
    last_login_at INTEGER,
    created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
    updated_at INTEGER DEFAULT CURRENT_TIMESTAMP,
    emailVerified INTEGER DEFAULT 0,
    image TEXT,
    nickname TEXT
  );
  
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
    updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at INTEGER,
    created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
    updated_at INTEGER DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_account_id)
  );
  
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

  -- Better Auth에 필요한 추가 테이블
  CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
    updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS terms (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    version TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
    updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS business_info (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
    updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX IF NOT EXISTS idx_verification_identifier ON verification(identifier);
  CREATE INDEX IF NOT EXISTS idx_terms_type ON terms(type);
  CREATE INDEX IF NOT EXISTS idx_business_info_key ON business_info(key);

  -- 기기 카테고리
  CREATE TABLE IF NOT EXISTS device_categories (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
    updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
  );

  -- 기기 타입
  CREATE TABLE IF NOT EXISTS device_types (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    category_id TEXT REFERENCES device_categories(id),
    description TEXT,
    model_name TEXT,
    version_name TEXT,
    is_rentable INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    rental_settings TEXT,
    created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
    updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
  );

  -- 기기
  CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    device_type_id TEXT REFERENCES device_types(id),
    device_number INTEGER NOT NULL,
    status TEXT DEFAULT 'available',
    created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
    updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
  );

  -- 플레이 모드
  CREATE TABLE IF NOT EXISTS play_modes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    device_type_id TEXT REFERENCES device_types(id),
    name TEXT NOT NULL,
    price INTEGER,
    display_order INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
    updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
  );

  -- 예약
  CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT REFERENCES users(id),
    device_id TEXT REFERENCES devices(id),
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
    updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
  );

  -- 기기 규칙
  CREATE TABLE IF NOT EXISTS machine_rules (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
    updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
  );
`);

// 초기 데이터 입력
console.log('초기 데이터 입력 중...');

// 카테고리 추가
const categories = [
  { id: 'konami', name: 'KONAMI', display_order: 1 },
  { id: 'sega', name: 'SEGA', display_order: 2 },
  { id: 'nintendo', name: 'Nintendo', display_order: 3 },
  { id: 'sony', name: 'SONY', display_order: 4 },
  { id: 'racing', name: 'Racing', display_order: 5 }
];

for (const cat of categories) {
  db.prepare(`
    INSERT OR REPLACE INTO device_categories (id, name, display_order)
    VALUES (?, ?, ?)
  `).run(cat.id, cat.name, cat.display_order);
}

// 기기 타입 추가
const deviceTypes = [
  {
    id: 'beatmania',
    name: 'beatmania IIDX 31 EPOLIS',
    category_id: 'konami',
    model_name: 'IIDX 31',
    version_name: 'EPOLIS',
    is_rentable: 1,
    display_order: 1
  },
  {
    id: 'maimai',
    name: 'maimai DX BUDDiES PLUS',
    category_id: 'sega',
    model_name: 'DX',
    version_name: 'BUDDiES PLUS',
    is_rentable: 1,
    display_order: 2
  },
  {
    id: 'switch',
    name: 'Nintendo Switch',
    category_id: 'nintendo',
    model_name: 'Switch',
    version_name: 'OLED',
    is_rentable: 0,
    display_order: 3
  },
  {
    id: 'ps5',
    name: 'PlayStation 5',
    category_id: 'sony',
    model_name: 'PS5',
    version_name: 'Standard',
    is_rentable: 0,
    display_order: 4
  },
  {
    id: 'racing',
    name: 'Racing Simulator',
    category_id: 'racing',
    model_name: 'GT',
    version_name: 'Pro',
    is_rentable: 1,
    display_order: 5
  }
];

for (const type of deviceTypes) {
  db.prepare(`
    INSERT OR REPLACE INTO device_types (id, name, category_id, model_name, version_name, is_rentable, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(type.id, type.name, type.category_id, type.model_name, type.version_name, type.is_rentable, type.display_order);
}

// 기기 추가
const devices = [
  { device_type_id: 'beatmania', device_number: 1 },
  { device_type_id: 'beatmania', device_number: 2 },
  { device_type_id: 'maimai', device_number: 1 },
  { device_type_id: 'maimai', device_number: 2 },
  { device_type_id: 'switch', device_number: 1 },
  { device_type_id: 'switch', device_number: 2 },
  { device_type_id: 'switch', device_number: 3 },
  { device_type_id: 'ps5', device_number: 1 },
  { device_type_id: 'ps5', device_number: 2 },
  { device_type_id: 'racing', device_number: 1 }
];

for (const device of devices) {
  db.prepare(`
    INSERT INTO devices (device_type_id, device_number, status)
    VALUES (?, ?, 'available')
  `).run(device.device_type_id, device.device_number);
}

// 플레이 모드 추가
const playModes = [
  { device_type_id: 'beatmania', name: '프리미엄', price: 1000, display_order: 1 },
  { device_type_id: 'beatmania', name: '일반', price: 500, display_order: 2 },
  { device_type_id: 'maimai', name: '프리미엄', price: 1000, display_order: 1 },
  { device_type_id: 'maimai', name: '일반', price: 500, display_order: 2 }
];

for (const mode of playModes) {
  db.prepare(`
    INSERT INTO play_modes (device_type_id, name, price, display_order)
    VALUES (?, ?, ?, ?)
  `).run(mode.device_type_id, mode.name, mode.price, mode.display_order);
}

// 기기 규칙 추가
const rules = [
  {
    title: '이용 시간',
    content: '평일: 14:00 - 22:00\n주말/공휴일: 12:00 - 22:00',
    display_order: 1
  },
  {
    title: '예약 규칙',
    content: '1일 최대 2시간 예약 가능\n노쇼 3회 시 1개월 예약 제한',
    display_order: 2
  }
];

for (const rule of rules) {
  db.prepare(`
    INSERT INTO machine_rules (title, content, is_active, display_order)
    VALUES (?, ?, 1, ?)
  `).run(rule.title, rule.content, rule.display_order);
}

console.log('데이터베이스 초기화 완료!');
db.close();