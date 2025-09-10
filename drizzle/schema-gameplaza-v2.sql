-- 게임플라자 V2 - Cloudflare D1 전용 스키마
-- SQLite 기반 완전 새 설계 (Supabase와 무관)
-- 설계일: 2025-01-15

-- ============================================================================
-- 1. 사용자 관리 (Better Auth와 연동)
-- ============================================================================

-- 사용자 기본 정보 (Better Auth 확장)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- Better Auth와 연동되는 UUID
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  nickname TEXT,
  phone TEXT,
  avatar_url TEXT,
  
  -- 권한 및 상태
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'super_admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
  
  -- 마케팅 및 알림 동의
  marketing_consent INTEGER NOT NULL DEFAULT 0, -- 0: 동의안함, 1: 동의
  push_notifications INTEGER NOT NULL DEFAULT 1,
  
  -- 시간 정보 (KST 기준)
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  last_login_at INTEGER,
  
  -- 사용자 통계
  total_reservations INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0, -- 총 사용 금액 (원)
  loyalty_points INTEGER NOT NULL DEFAULT 0
);

-- ============================================================================
-- 2. 기기 관리 시스템
-- ============================================================================

-- 기기 카테고리 (리듬게임, 레이싱 등)
CREATE TABLE IF NOT EXISTS device_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE, -- 'rhythm', 'racing', 'shooting' 등
  display_name TEXT NOT NULL, -- '리듬게임', '레이싱', '슈팅게임'
  description TEXT,
  icon TEXT, -- 아이콘 이름 또는 URL
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- 기기 타입 (사운드볼텍스, 마이마이, 츄니즘 등)
CREATE TABLE IF NOT EXISTS device_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  
  name TEXT NOT NULL, -- 'sound_voltex', 'maimai', 'chunithm'
  display_name TEXT NOT NULL, -- '사운드볼텍스', '마이마이', '츄니즘'
  description TEXT,
  manufacturer TEXT, -- 제조사
  model TEXT, -- 모델명
  
  -- 가격 정책
  base_price INTEGER NOT NULL DEFAULT 1000, -- 기본 요금 (원)
  peak_time_multiplier REAL NOT NULL DEFAULT 1.2, -- 피크타임 배율
  
  -- 예약 정책
  max_play_time INTEGER NOT NULL DEFAULT 30, -- 최대 플레이 시간 (분)
  advance_booking_days INTEGER NOT NULL DEFAULT 7, -- 사전 예약 가능 일수
  
  -- 기타 정보
  image_url TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  
  FOREIGN KEY (category_id) REFERENCES device_categories(id) ON DELETE CASCADE
);

-- 실제 기기 (개별 기계)
CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_type_id INTEGER NOT NULL,
  
  -- 기기 식별 정보
  device_number TEXT NOT NULL UNIQUE, -- '001', '002' 등 기기 번호
  location TEXT, -- 'A구역', 'B구역' 등
  
  -- 상태 정보
  status TEXT NOT NULL DEFAULT 'available' CHECK (
    status IN ('available', 'occupied', 'maintenance', 'out_of_order')
  ),
  
  -- 관리 정보
  last_maintenance_at INTEGER,
  maintenance_notes TEXT,
  
  -- 설치 및 관리
  installed_at INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  
  FOREIGN KEY (device_type_id) REFERENCES device_types(id) ON DELETE CASCADE
);

-- ============================================================================
-- 3. 예약 시스템
-- ============================================================================

-- 예약 메인 테이블
CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 기본 정보
  user_id TEXT NOT NULL,
  device_id INTEGER NOT NULL,
  
  -- 시간 정보 (KST, Unix timestamp)
  reserved_date TEXT NOT NULL, -- YYYY-MM-DD 형식
  start_time TEXT NOT NULL, -- HH:MM 형식 (24시간제, 24~29시 포함)
  end_time TEXT NOT NULL, -- HH:MM 형식
  duration INTEGER NOT NULL, -- 예약 시간 (분)
  
  -- 상태 관리
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show')
  ),
  
  -- 금액 정보
  base_amount INTEGER NOT NULL, -- 기본 요금
  final_amount INTEGER NOT NULL, -- 최종 결제 금액 (할인 등 적용)
  
  -- 체크인/아웃 정보
  checked_in_at INTEGER,
  checked_out_at INTEGER,
  actual_start_time TEXT, -- 실제 시작 시간
  actual_end_time TEXT, -- 실제 종료 시간
  
  -- 추가 정보
  notes TEXT, -- 사용자 메모
  admin_notes TEXT, -- 관리자 메모
  
  -- 시간 정보
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- ============================================================================
-- 4. 결제 시스템
-- ============================================================================

-- 결제 정보
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  
  -- 결제 정보
  amount INTEGER NOT NULL, -- 결제 금액
  payment_method TEXT NOT NULL CHECK (
    payment_method IN ('cash', 'card', 'mobile', 'account_transfer')
  ),
  
  -- 결제 상태
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')
  ),
  
  -- 외부 결제 정보
  transaction_id TEXT, -- 외부 결제 시스템의 거래 ID
  payment_gateway TEXT, -- 결제 게이트웨이 ('toss', 'kakao_pay' 등)
  
  -- 시간 정보
  paid_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- 5. 운영 시간 및 일정 관리
-- ============================================================================

-- 영업 시간 및 특별 일정
CREATE TABLE IF NOT EXISTS business_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 날짜 정보
  date TEXT NOT NULL UNIQUE, -- YYYY-MM-DD 형식
  day_of_week INTEGER NOT NULL, -- 0: 일요일, 1: 월요일, ..., 6: 토요일
  
  -- 영업 시간
  open_time TEXT NOT NULL, -- HH:MM 형식
  close_time TEXT NOT NULL, -- HH:MM 형식 (익일 새벽은 24~29시)
  
  -- 특별 운영
  is_holiday INTEGER NOT NULL DEFAULT 0,
  is_special_event INTEGER NOT NULL DEFAULT 0,
  event_name TEXT,
  
  -- 요금 정책
  is_peak_time INTEGER NOT NULL DEFAULT 0, -- 피크타임 여부
  price_multiplier REAL NOT NULL DEFAULT 1.0, -- 가격 배율
  
  -- 예약 정책
  max_advance_booking INTEGER, -- 해당 날짜의 최대 사전 예약 일수
  
  notes TEXT,
  
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- ============================================================================
-- 6. 시스템 설정 및 관리
-- ============================================================================

-- 시스템 설정
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL, -- 'business', 'payment', 'notification' 등
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  data_type TEXT NOT NULL DEFAULT 'string' CHECK (
    data_type IN ('string', 'number', 'boolean', 'json')
  ),
  
  description TEXT,
  is_public INTEGER NOT NULL DEFAULT 0, -- 공개 설정 여부
  
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  
  UNIQUE(category, key)
);

-- 관리자 로그 (중요한 액션 기록)
CREATE TABLE IF NOT EXISTS admin_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id TEXT NOT NULL,
  
  -- 액션 정보
  action TEXT NOT NULL, -- 'create_reservation', 'cancel_reservation', 'update_device' 등
  target_type TEXT NOT NULL, -- 'reservation', 'device', 'user' 등
  target_id TEXT NOT NULL, -- 대상의 ID
  
  -- 변경 내용
  old_data TEXT, -- JSON 형태의 변경 전 데이터
  new_data TEXT, -- JSON 형태의 변경 후 데이터
  
  -- 추가 정보
  ip_address TEXT,
  user_agent TEXT,
  notes TEXT,
  
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- 인덱스 생성 (성능 최적화)
-- ============================================================================

-- 사용자 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 기기 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(device_type_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_number ON devices(device_number);

-- 예약 관련 인덱스 (가장 중요)
CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_device ON reservations(device_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reserved_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_time ON reservations(reserved_date, start_time);
CREATE INDEX IF NOT EXISTS idx_reservations_device_time ON reservations(device_id, reserved_date, start_time);

-- 결제 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_payments_reservation ON payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 일정 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_business_schedules_date ON business_schedules(date);

-- 시스템 설정 인덱스
CREATE INDEX IF NOT EXISTS idx_system_settings_category_key ON system_settings(category, key);

-- 관리자 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON admin_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at);