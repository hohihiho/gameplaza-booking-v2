-- 게임플라자 예약 시스템 D1 스키마
-- Cloudflare D1 SQLite용 초기 스키마

-- 사용자 테이블
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  profile_image_url TEXT,
  marketing_consent BOOLEAN DEFAULT FALSE,
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- 기기 타입 테이블
CREATE TABLE device_types (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  hourly_rate INTEGER NOT NULL DEFAULT 0, -- 원 단위
  daily_max_hours INTEGER DEFAULT 8,
  requires_approval BOOLEAN DEFAULT FALSE,
  icon_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 기기 테이블
CREATE TABLE devices (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  device_type_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'offline')),
  location TEXT,
  specifications TEXT, -- JSON 문자열로 저장
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_type_id) REFERENCES device_types(id)
);

-- 기기 인덱스
CREATE INDEX idx_devices_type ON devices(device_type_id);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_devices_name ON devices(name);

-- 예약 테이블
CREATE TABLE reservations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show')),
  total_amount INTEGER DEFAULT 0, -- 원 단위
  notes TEXT,
  admin_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (device_id) REFERENCES devices(id)
);

-- 예약 인덱스
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_device ON reservations(device_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_time ON reservations(start_time, end_time);
CREATE INDEX idx_reservations_created_at ON reservations(created_at);

-- 예약 시간 겹침 방지를 위한 복합 인덱스
CREATE UNIQUE INDEX idx_reservations_device_time_conflict ON reservations(
  device_id, start_time, end_time
) WHERE status IN ('confirmed', 'checked_in');

-- 체크인 테이블
CREATE TABLE checkins (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  reservation_id TEXT NOT NULL UNIQUE,
  checked_in_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  checked_out_at DATETIME,
  actual_end_time DATETIME,
  overtime_minutes INTEGER DEFAULT 0,
  additional_charges INTEGER DEFAULT 0, -- 원 단위
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

-- 체크인 인덱스
CREATE INDEX idx_checkins_reservation ON checkins(reservation_id);
CREATE INDEX idx_checkins_time ON checkins(checked_in_at, checked_out_at);

-- 시간대 템플릿 테이블 (운영시간 관리)
CREATE TABLE time_slot_templates (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=일요일
  start_time TEXT NOT NULL, -- HH:MM 형식
  end_time TEXT NOT NULL, -- HH:MM 형식 (24시간 이상 가능: 26:00 등)
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 시간대 템플릿 인덱스
CREATE INDEX idx_time_slots_day ON time_slot_templates(day_of_week);
CREATE INDEX idx_time_slots_active ON time_slot_templates(is_active);

-- 휴일 테이블
CREATE TABLE holidays (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  date DATE NOT NULL UNIQUE,
  is_closed BOOLEAN DEFAULT TRUE,
  special_hours_start TEXT, -- HH:MM 형식
  special_hours_end TEXT, -- HH:MM 형식
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 휴일 인덱스
CREATE INDEX idx_holidays_date ON holidays(date);
CREATE INDEX idx_holidays_closed ON holidays(is_closed);

-- 관리자 로그 테이블
CREATE TABLE admin_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  admin_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT, -- 'reservation', 'device', 'user' 등
  target_id TEXT,
  details TEXT, -- JSON 문자열로 세부 정보 저장
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id)
);

-- 관리자 로그 인덱스
CREATE INDEX idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_action ON admin_logs(action);
CREATE INDEX idx_admin_logs_target ON admin_logs(target_type, target_id);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at);

-- 푸시 알림 구독 테이블
CREATE TABLE push_subscriptions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 푸시 구독 인덱스
CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_active ON push_subscriptions(is_active);

-- 알림 템플릿 테이블
CREATE TABLE notification_templates (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL UNIQUE,
  title_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reservation_reminder', 'checkin_reminder', 'system_notice')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 알림 템플릿 인덱스
CREATE INDEX idx_notification_templates_type ON notification_templates(type);
CREATE INDEX idx_notification_templates_active ON notification_templates(is_active);

-- 시스템 설정 테이블
CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 기본 설정값 삽입
INSERT INTO system_settings (key, value, description, type) VALUES
('business_hours_start', '10:00', '영업 시작 시간', 'string'),
('business_hours_end', '29:00', '영업 종료 시간 (다음날 5시 = 29시)', 'string'),
('reservation_advance_days', '7', '예약 가능한 최대 일수', 'number'),
('max_daily_reservations_per_user', '3', '사용자 당 일일 최대 예약 수', 'number'),
('default_reservation_duration', '2', '기본 예약 시간 (시간)', 'number'),
('overtime_grace_minutes', '10', '연장 허용 시간 (분)', 'number'),
('contact_phone', '062-123-4567', '문의 전화번호', 'string'),
('contact_address', '광주광역시 서구 상무대로 123', '주소', 'string');

-- 트리거: 업데이트 시간 자동 갱신
CREATE TRIGGER update_users_updated_at 
  AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_devices_updated_at 
  AFTER UPDATE ON devices
BEGIN
  UPDATE devices SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_reservations_updated_at 
  AFTER UPDATE ON reservations
BEGIN
  UPDATE reservations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_checkins_updated_at 
  AFTER UPDATE ON checkins
BEGIN
  UPDATE checkins SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_system_settings_updated_at 
  AFTER UPDATE ON system_settings
BEGIN
  UPDATE system_settings SET updated_at = CURRENT_TIMESTAMP WHERE key = NEW.key;
END;