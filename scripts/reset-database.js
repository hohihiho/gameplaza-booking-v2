const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(process.cwd(), 'dev.db');

console.log('🔄 데이터베이스 완전 리셋 시작...\n');

// 기존 데이터베이스 삭제
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('✅ 기존 데이터베이스 삭제 완료');
}

// 새 데이터베이스 생성
const db = new Database(DB_PATH);
console.log('✅ 새 데이터베이스 생성 완료\n');

console.log('📋 테이블 생성 중...');

// Better Auth 필수 테이블 생성
db.exec(`
  -- Better Auth 사용자 테이블
  CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    emailVerified BOOLEAN DEFAULT FALSE,
    name TEXT,
    image TEXT,
    createdAt INTEGER DEFAULT (unixepoch()),
    updatedAt INTEGER DEFAULT (unixepoch())
  );
  
  -- Better Auth 계정 테이블 (OAuth 프로바이더 정보)
  CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    accountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    accessToken TEXT,
    refreshToken TEXT,
    idToken TEXT,
    accessTokenExpiresAt INTEGER,
    refreshTokenExpiresAt INTEGER,
    scope TEXT,
    password TEXT,
    createdAt INTEGER DEFAULT (unixepoch()),
    updatedAt INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
  );
  
  -- Better Auth 세션 테이블
  CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    expiresAt INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    createdAt INTEGER DEFAULT (unixepoch()),
    updatedAt INTEGER DEFAULT (unixepoch()),
    ipAddress TEXT,
    userAgent TEXT,
    userId TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
  );
  
  -- Better Auth 인증 토큰 테이블
  CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt INTEGER NOT NULL,
    createdAt INTEGER DEFAULT (unixepoch()),
    updatedAt INTEGER DEFAULT (unixepoch())
  );
  
  -- 앱 전용 사용자 프로필 테이블 (확장 정보)
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    nickname TEXT,
    phone TEXT,
    role TEXT DEFAULT 'customer',
    profile_image TEXT,
    marketing_consent INTEGER DEFAULT 0,
    marketing_agreed INTEGER DEFAULT 0,
    push_notifications_enabled INTEGER DEFAULT 0,
    last_login_at INTEGER,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    emailVerified INTEGER DEFAULT 0,
    image TEXT
  );
  
  -- 기기 카테고리 테이블
  CREATE TABLE IF NOT EXISTS device_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  );
  
  -- 기기 타입 테이블
  CREATE TABLE IF NOT EXISTS device_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category_id TEXT REFERENCES device_categories(id),
    description TEXT,
    model_name TEXT,
    version_name TEXT,
    is_rentable INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    rental_settings TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  );
  
  -- 기기 테이블
  CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    device_type_id TEXT REFERENCES device_types(id),
    device_number INTEGER NOT NULL,
    status TEXT DEFAULT 'available',
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  );
  
  -- 플레이 모드 테이블
  CREATE TABLE IF NOT EXISTS play_modes (
    id TEXT PRIMARY KEY,
    device_type_id TEXT REFERENCES device_types(id),
    name TEXT NOT NULL,
    price INTEGER,
    display_order INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  );
  
  -- 예약 테이블
  CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    device_id TEXT REFERENCES devices(id),
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  );
  
  -- 기기 규칙 테이블
  CREATE TABLE IF NOT EXISTS machine_rules (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  );
  
  -- 약관 테이블
  CREATE TABLE IF NOT EXISTS terms (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    version TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  );
  
  -- 사업자 정보 테이블
  CREATE TABLE IF NOT EXISTS business_info (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  );
  
  -- 인덱스 생성
  CREATE INDEX IF NOT EXISTS idx_user_email ON user(email);
  CREATE INDEX IF NOT EXISTS idx_account_userId ON account(userId);
  CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
  CREATE INDEX IF NOT EXISTS idx_session_userId ON session(userId);
  CREATE INDEX IF NOT EXISTS idx_verification_identifier ON verification(identifier);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_terms_type ON terms(type);
  CREATE INDEX IF NOT EXISTS idx_business_info_key ON business_info(key);
`);

console.log('✅ 모든 테이블 생성 완료\n');

// 초기 데이터 입력
console.log('📦 초기 데이터 입력 중...');

// 카테고리 추가
const categories = [
  { id: 'konami', name: 'KONAMI', display_order: 1 },
  { id: 'sega', name: 'SEGA', display_order: 2 },
  { id: 'nintendo', name: 'Nintendo', display_order: 3 },
  { id: 'sony', name: 'SONY', display_order: 4 },
  { id: 'racing', name: 'Racing', display_order: 5 }
];

const insertCategory = db.prepare(`
  INSERT INTO device_categories (id, name, display_order) VALUES (?, ?, ?)
`);

for (const cat of categories) {
  insertCategory.run(cat.id, cat.name, cat.display_order);
}
console.log('  ✓ 카테고리 데이터 입력 완료');

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

const insertDeviceType = db.prepare(`
  INSERT INTO device_types (id, name, category_id, model_name, version_name, is_rentable, display_order)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const type of deviceTypes) {
  insertDeviceType.run(
    type.id, type.name, type.category_id, 
    type.model_name, type.version_name, 
    type.is_rentable, type.display_order
  );
}
console.log('  ✓ 기기 타입 데이터 입력 완료');

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

const insertDevice = db.prepare(`
  INSERT INTO devices (id, device_type_id, device_number, status)
  VALUES (?, ?, ?, 'available')
`);

for (const device of devices) {
  const deviceId = `${device.device_type_id}_${device.device_number}`;
  insertDevice.run(deviceId, device.device_type_id, device.device_number);
}
console.log('  ✓ 기기 데이터 입력 완료');

// 플레이 모드 추가
const playModes = [
  { id: 'beat_premium', device_type_id: 'beatmania', name: '프리미엄', price: 1000, display_order: 1 },
  { id: 'beat_normal', device_type_id: 'beatmania', name: '일반', price: 500, display_order: 2 },
  { id: 'mai_premium', device_type_id: 'maimai', name: '프리미엄', price: 1000, display_order: 1 },
  { id: 'mai_normal', device_type_id: 'maimai', name: '일반', price: 500, display_order: 2 }
];

const insertPlayMode = db.prepare(`
  INSERT INTO play_modes (id, device_type_id, name, price, display_order)
  VALUES (?, ?, ?, ?, ?)
`);

for (const mode of playModes) {
  insertPlayMode.run(mode.id, mode.device_type_id, mode.name, mode.price, mode.display_order);
}
console.log('  ✓ 플레이 모드 데이터 입력 완료');

// 기기 규칙 추가
const rules = [
  {
    id: 'rule1',
    title: '이용 시간',
    content: '평일: 14:00 - 22:00\n주말/공휴일: 12:00 - 22:00',
    display_order: 1
  },
  {
    id: 'rule2',
    title: '예약 규칙',
    content: '1일 최대 2시간 예약 가능\n노쇼 3회 시 1개월 예약 제한',
    display_order: 2
  }
];

const insertRule = db.prepare(`
  INSERT INTO machine_rules (id, title, content, is_active, display_order)
  VALUES (?, ?, ?, 1, ?)
`);

for (const rule of rules) {
  insertRule.run(rule.id, rule.title, rule.content, rule.display_order);
}
console.log('  ✓ 기기 규칙 데이터 입력 완료');

console.log('\n✅ 데이터베이스 리셋 완료!');
console.log('\n📌 슈퍼관리자 계정:');
console.log('  - ndz5496@gmail.com (가입 시 자동으로 슈퍼관리자 권한 부여)');
console.log('  - leejinseok94@gmail.com (가입 시 자동으로 슈퍼관리자 권한 부여)');

db.close();