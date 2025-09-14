-- 게임플라자 D1 데이터베이스 완전한 스키마
-- 생성일: 2024년

-- ========================================
-- 1. 사용자 관리 테이블들
-- ========================================

-- Users 테이블
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER DEFAULT 0,
  name TEXT,
  image TEXT,
  role TEXT DEFAULT 'user', -- user, vip, admin, super_admin
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  ban_expires_at INTEGER,
  ban_reason TEXT,
  warning_count INTEGER DEFAULT 0,
  last_login_at INTEGER,
  phone_number TEXT,
  birth_date TEXT,
  profile_completed INTEGER DEFAULT 0
);

-- Sessions 테이블
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  ip_address TEXT,
  user_agent TEXT
);

-- Accounts 테이블 (OAuth)
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Verification codes
CREATE TABLE IF NOT EXISTS verifications (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

-- ========================================
-- 2. 기기 관리 테이블들
-- ========================================

-- Device Types 테이블
CREATE TABLE IF NOT EXISTS device_types (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL UNIQUE,
  model_name TEXT,
  version_name TEXT,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Devices 테이블
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  device_type_id TEXT NOT NULL REFERENCES device_types(id),
  device_number INTEGER NOT NULL,
  location_floor INTEGER NOT NULL,
  location_area TEXT,
  status TEXT DEFAULT 'available', -- available, occupied, maintenance, out_of_order
  last_maintenance_at INTEGER,
  maintenance_notes TEXT,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(device_type_id, device_number)
);

-- ========================================
-- 3. 예약 시스템 테이블들
-- ========================================

-- Time Slots 테이블
CREATE TABLE IF NOT EXISTS time_slots (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  slot_type TEXT NOT NULL, -- early, regular, overnight
  is_available INTEGER DEFAULT 1,
  price INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Reservations 테이블
CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id),
  device_id TEXT NOT NULL REFERENCES devices(id),
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  player_count INTEGER DEFAULT 1,
  status TEXT DEFAULT 'confirmed', -- pending, confirmed, checked_in, completed, cancelled, no_show
  payment_status TEXT DEFAULT 'unpaid', -- unpaid, paid, refunded
  payment_amount INTEGER,
  special_requests TEXT,
  check_in_time INTEGER,
  check_out_time INTEGER,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  cancelled_at INTEGER,
  cancellation_reason TEXT,
  refund_amount INTEGER
);

-- ========================================
-- 4. 스케줄 관리 테이블들
-- ========================================

-- Schedule Events 테이블
CREATE TABLE IF NOT EXISTS schedule_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  end_date TEXT,
  start_time TEXT,
  end_time TEXT,
  type TEXT NOT NULL, -- special, early_open, overnight, early_close, event, reservation_block
  affects_reservation INTEGER DEFAULT 0,
  block_type TEXT, -- early, overnight, all_day (for reservation_block type)
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id)
);

-- ========================================
-- 5. CMS 컨텐츠 테이블들
-- ========================================

-- Guide Contents 테이블 (이용안내)
CREATE TABLE IF NOT EXISTS guide_contents (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  category TEXT NOT NULL, -- 'arcade' 또는 'reservation'
  section TEXT NOT NULL, -- 'rules', 'broadcast', 'vending', 'card', 'reservation_rules' 등
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- JSON 형태의 배열로 저장 (불렛 포인트들)
  order_index INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  updated_by TEXT REFERENCES users(id)
);

-- ========================================
-- 6. 인덱스 생성
-- ========================================

-- Users 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Sessions 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Accounts 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_provider ON accounts(provider_id, account_id);

-- Devices 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(device_type_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_floor ON devices(location_floor);
CREATE INDEX IF NOT EXISTS idx_devices_active ON devices(is_active);

-- Reservations 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_device_id ON reservations(device_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at);
CREATE INDEX IF NOT EXISTS idx_reservations_date_time ON reservations(date, start_time);

-- Schedule Events 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_schedule_events_date ON schedule_events(date);
CREATE INDEX IF NOT EXISTS idx_schedule_events_type ON schedule_events(type);
CREATE INDEX IF NOT EXISTS idx_schedule_events_date_range ON schedule_events(date, end_date);

-- Guide Contents 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_guide_contents_category ON guide_contents(category);
CREATE INDEX IF NOT EXISTS idx_guide_contents_section ON guide_contents(section);
CREATE INDEX IF NOT EXISTS idx_guide_contents_active ON guide_contents(is_active);
CREATE INDEX IF NOT EXISTS idx_guide_contents_order ON guide_contents(category, order_index);

-- ========================================
-- 7. 기본 데이터 삽입
-- ========================================

-- Device Types 기본 데이터
INSERT OR IGNORE INTO device_types (id, name, model_name, version_name, color, description) VALUES 
('sdvx', '사운드 볼텍스', 'SOUND VOLTEX', 'EXCEED GEAR', '#3B82F6', '4개 버튼 + 2개 노브를 사용하는 리듬게임'),
('iidx', '비트매니아 IIDX', 'beatmania IIDX', '32 HEROIC VERSE', '#EC4899', '7개 건반 + 스크래치를 사용하는 리듬게임'),
('maimai', '마이마이 DX', 'maimai DX', 'BUDDiES PLUS', '#8B5CF6', '터치스크린 원형 패널을 사용하는 리듬게임'),
('chunithm', '츄니즘 NEW!!', 'CHUNITHM NEW!!', 'PLUS', '#F97316', '16개 건반 + 적외선 센서를 사용하는 리듬게임'),
('wacca', '왓카', 'WACCA', 'Lily R', '#F59E0B', '360도 원형 터치 패널을 사용하는 리듬게임'),
('nostalgia', '노스텔지아', 'NOSTALGIA', 'ƒORTE', '#10B981', '피아노 건반을 사용하는 리듬게임'),
('taiko', '태고의 달인', '太鼓の達人', 'ニジイロ Ver.', '#EAB308', '북을 두드리는 리듬게임');

-- Time Slots 기본 데이터
INSERT OR IGNORE INTO time_slots (start_time, end_time, slot_type, price) VALUES 
-- 조기 시간대 (7-12시)
('07:00', '08:00', 'early', 8000),
('08:00', '09:00', 'early', 8000),
('09:00', '10:00', 'early', 8000),
('10:00', '11:00', 'early', 8000),
('11:00', '12:00', 'early', 8000),
-- 일반 시간대 (12-22시)
('12:00', '13:00', 'regular', 6000),
('13:00', '14:00', 'regular', 6000),
('14:00', '15:00', 'regular', 6000),
('15:00', '16:00', 'regular', 6000),
('16:00', '17:00', 'regular', 6000),
('17:00', '18:00', 'regular', 6000),
('18:00', '19:00', 'regular', 6000),
('19:00', '20:00', 'regular', 6000),
('20:00', '21:00', 'regular', 6000),
('21:00', '22:00', 'regular', 6000),
-- 밤샘 시간대 (22시-익일5시)
('22:00', '05:00', 'overnight', 25000);

-- Guide Contents 기본 데이터
INSERT OR IGNORE INTO guide_contents (category, section, title, content, order_index) VALUES
-- 오락실 이용안내
('arcade', 'rules', '이용수칙', '["기기를 소중히 다뤄주세요","음료수는 지정된 장소에만 놓아주세요","큰 소리로 떠들지 말아주세요","다른 이용자를 배려해주세요","쓰레기는 쓰레기통에 버려주세요","대기카드 놓은 순서대로 이용해주시고, 순서가 되면 바로 플레이해주세요","유령카드를 만들지 마시고 실제 플레이할 때만 대기카드를 놓아주세요","게임기에 음료수를 흘리지 않도록 주의해주세요","음료수를 흘리거나 쏟으셨을 시 기기 닦는 걸레로 닦지 마시고 현장 관리자에게 알려주세요","게임 플레이 중 프리징 문제 발생 시 현장 관리자에게 문의해주세요","보수가 필요한 문제의 경우 1:1 카카오톡 문의에 남겨주세요"]', 1),
('arcade', 'broadcast', '방송기기 이용안내', '["방송용 기기는 사전 예약 필수입니다","스트리밍 시 다른 이용자 촬영에 주의해주세요","방송 장비 대여 가능 (문의 필요)","소음 수준을 적절히 유지해주세요"]', 2),
('arcade', 'vending', '음료수 자판기 이용안내', '["자판기는 1층과 2층에 위치합니다","동전과 지폐 모두 사용 가능합니다","고장 시 카운터로 문의해주세요","뜨거운 음료 취급 시 주의하세요"]', 3),
('arcade', 'card', '선불카드 안내', '["카드 구매: 카운터에서 가능","충전: 1,000원 단위로 충전 가능","잔액 환불: 카운터에서 신청","카드 분실 시 재발급 불가","유효기간: 최종 사용일로부터 1년"]', 4),

-- 예약 이용안내
('reservation', 'rules', '예약 규정', '["예약은 최대 2주 전부터 가능합니다","당일 예약은 불가능합니다","1인당 주 3회까지 예약 가능","예약 시간 10분 경과 시 자동 취소됩니다"]', 1),
('reservation', 'timeslots', '예약 시간대', '["조기 예약: 오전 7시-12시","일반 예약: 오후 12시-10시","밤샘 예약: 오후 10시-익일 오전 5시","주말/공휴일은 예약 경쟁이 치열합니다"]', 2),
('reservation', 'cancel', '취소 규정', '["예약 24시간 전: 100% 환불","예약 12시간 전: 50% 환불","예약 12시간 이내: 환불 불가","노쇼 3회 시 1개월 예약 제한"]', 3),
('reservation', 'confirm', '예약 확정 조건', '["예약금 결제 완료 시 확정","카드 또는 계좌이체로 결제 가능","예약 확정 후 SMS 발송","체크인은 예약 시간 10분 전부터 가능"]', 4);