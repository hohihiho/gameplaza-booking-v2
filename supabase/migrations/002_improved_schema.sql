-- GamePlaza V2 개선된 데이터베이스 스키마
-- 생성일: 2025-06-26
-- 변경사항: 기존 테이블 삭제 후 새로운 구조로 재생성

-- 기존 테이블 삭제 (의존성 순서대로)
DROP TABLE IF EXISTS special_operations CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS device_time_slots CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS device_types CASCADE;
DROP TABLE IF EXISTS content_sections CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 트리거 함수 재생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. 사용자 테이블 (Supabase Auth와 연동)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  phone_verified BOOLEAN DEFAULT false,
  nickname VARCHAR(50),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'staff', 'admin')),
  is_blacklisted BOOLEAN DEFAULT false,
  blacklist_reason TEXT,
  blacklisted_at TIMESTAMP WITH TIME ZONE,
  blacklisted_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- 2. 관리자 테이블 (별도 관리)
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '{"reservations": true, "users": true, "devices": true, "cms": true}'::jsonb,
  is_super_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 기기 테이블 (전체 기기 관리)
CREATE TABLE machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_number VARCHAR(50) UNIQUE NOT NULL, -- 관리번호: 마이마이-1, 츄니즘-2 등
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('maimai', 'chunithm', 'tekken', 'sf6', 'other')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  purchase_date DATE,
  last_maintenance_date DATE,
  location VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 대여 가능 기기 테이블
CREATE TABLE rental_machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID UNIQUE REFERENCES machines(id) ON DELETE CASCADE,
  display_name VARCHAR(100) NOT NULL, -- 사용자에게 보여질 이름
  display_order INTEGER DEFAULT 0,
  hourly_rate INTEGER NOT NULL CHECK (hourly_rate >= 0),
  min_hours INTEGER DEFAULT 1 CHECK (min_hours > 0),
  max_hours INTEGER DEFAULT 6 CHECK (max_hours >= min_hours),
  max_players INTEGER DEFAULT 1 CHECK (max_players IN (1, 2)), -- 마이마이 2P 지원
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  image_url TEXT,
  tags TEXT[], -- ['인기', '신규', '프리미엄'] 등
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 시간대별 예약 가능 설정
CREATE TABLE time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  rental_machine_id UUID REFERENCES rental_machines(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  special_rate INTEGER, -- 특별 요금 (NULL이면 기본 요금 사용)
  slot_type VARCHAR(20) DEFAULT 'regular' CHECK (slot_type IN ('regular', 'early', 'overnight', 'holiday', 'event')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, rental_machine_id, start_time, end_time)
);

-- 6. 예약 테이블
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_number VARCHAR(50) UNIQUE NOT NULL, -- RES-20250626-001 형식
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rental_machine_id UUID REFERENCES rental_machines(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  hours INTEGER GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (end_time - start_time))/3600) STORED,
  player_count INTEGER DEFAULT 1 CHECK (player_count IN (1, 2)),
  hourly_rate INTEGER NOT NULL,
  total_amount INTEGER GENERATED ALWAYS AS (hourly_rate * EXTRACT(EPOCH FROM (end_time - start_time))/3600 * player_count) STORED,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'checked_in', 'completed', 'cancelled', 'no_show')),
  
  -- 승인 관련
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  
  -- 체크인 관련
  check_in_at TIMESTAMP WITH TIME ZONE,
  check_in_by UUID REFERENCES users(id),
  
  -- 결제 관련
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'transfer')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_confirmed_at TIMESTAMP WITH TIME ZONE,
  payment_confirmed_by UUID REFERENCES users(id),
  
  -- 기타
  user_notes TEXT, -- 사용자 메모
  admin_notes TEXT, -- 관리자 메모
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by UUID REFERENCES users(id),
  cancellation_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 특별 영업 일정 (조기개장, 밤샘영업)
CREATE TABLE special_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('early', 'overnight', 'holiday', 'event')),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  min_reservations INTEGER DEFAULT 1,
  is_confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, schedule_type)
);

-- 8. 관리자 활동 로그
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50), -- 'reservation', 'user', 'machine', 'content'
  target_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 알림 내역
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 시스템 설정
CREATE TABLE settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- 11. CMS 콘텐츠
CREATE TABLE content_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  content JSONB NOT NULL,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
-- 예약 조회 최적화
CREATE INDEX idx_reservations_user_status ON reservations(user_id, status);
CREATE INDEX idx_reservations_date_status ON reservations(date, status);
CREATE INDEX idx_reservations_machine_date ON reservations(rental_machine_id, date);
CREATE INDEX idx_reservations_created_at ON reservations(created_at DESC);

-- 시간대 슬롯 조회 최적화
CREATE INDEX idx_time_slots_date_machine ON time_slots(date, rental_machine_id);
CREATE INDEX idx_time_slots_availability ON time_slots(date, is_available) WHERE is_available = true;

-- 사용자 조회 최적화
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_users_role ON users(role) WHERE role != 'user';

-- 알림 조회 최적화
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- 관리자 로그 조회 최적화
CREATE INDEX idx_admin_logs_created ON admin_logs(created_at DESC);
CREATE INDEX idx_admin_logs_admin ON admin_logs(admin_id, created_at DESC);

-- 업데이트 트리거 적용
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON machines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rental_machines_updated_at BEFORE UPDATE ON rental_machines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_special_schedules_updated_at BEFORE UPDATE ON special_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_pages_updated_at BEFORE UPDATE ON content_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 예약 번호 자동 생성 함수
CREATE OR REPLACE FUNCTION generate_reservation_number()
RETURNS TRIGGER AS $$
DECLARE
    today_count INTEGER;
    new_number VARCHAR(50);
BEGIN
    -- 오늘 날짜의 예약 수 확인
    SELECT COUNT(*) + 1 INTO today_count
    FROM reservations
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- RES-YYYYMMDD-NNN 형식으로 생성
    new_number := 'RES-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(today_count::TEXT, 3, '0');
    
    NEW.reservation_number := new_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 예약 번호 생성 트리거
CREATE TRIGGER generate_reservation_number_trigger
BEFORE INSERT ON reservations
FOR EACH ROW
WHEN (NEW.reservation_number IS NULL)
EXECUTE FUNCTION generate_reservation_number();

-- 기본 설정 데이터 삽입
INSERT INTO settings (key, value, description) VALUES
('business_hours', '{"open": "10:00", "close": "22:00"}'::jsonb, '영업 시간'),
('early_bird_hours', '{"open": "08:00", "close": "10:00", "min_reservations": 2}'::jsonb, '조기개장 설정'),
('overnight_hours', '{"open": "22:00", "close": "08:00", "min_reservations": 3}'::jsonb, '밤샘영업 설정'),
('reservation_rules', '{"min_hours": 1, "max_hours": 4, "advance_days": 7, "cancellation_hours": 3}'::jsonb, '예약 규칙'),
('payment_info', '{"bank": "카카오뱅크", "account": "3333-01-1234567", "holder": "게임플라자"}'::jsonb, '결제 정보')
ON CONFLICT (key) DO NOTHING;

-- Row Level Security (RLS) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pages ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
-- 사용자는 자신의 정보만 조회/수정 가능
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- 예약은 본인 것만 조회 가능, 생성은 모두 가능
CREATE POLICY "Users can view own reservations" ON reservations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create reservations" ON reservations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pending reservations" ON reservations FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- 대여 가능 기기는 모두 조회 가능
CREATE POLICY "Anyone can view active rental machines" ON rental_machines FOR SELECT USING (is_active = true);

-- 시간대 슬롯은 모두 조회 가능
CREATE POLICY "Anyone can view available time slots" ON time_slots FOR SELECT USING (is_available = true);

-- 알림은 본인 것만 조회/수정 가능
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- 설정과 콘텐츠 페이지는 모두 조회 가능
CREATE POLICY "Anyone can view settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Anyone can view published content" ON content_pages FOR SELECT USING (is_published = true);

-- 관리자 권한 체크 함수
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'staff')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 관리자는 모든 데이터 접근 가능
CREATE POLICY "Admins can manage all users" ON users FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage all reservations" ON reservations FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage all machines" ON machines FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage all rental machines" ON rental_machines FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage all time slots" ON time_slots FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage all schedules" ON special_schedules FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage all notifications" ON notifications FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage all settings" ON settings FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage all content" ON content_pages FOR ALL USING (is_admin());
CREATE POLICY "Admins can view all logs" ON admin_logs FOR SELECT USING (is_admin());
CREATE POLICY "Admins can create logs" ON admin_logs FOR INSERT WITH CHECK (is_admin());