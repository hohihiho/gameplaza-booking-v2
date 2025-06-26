-- GamePlaza V2 데이터베이스 스키마
-- 생성일: 2024-06-26

-- 사용자 테이블 (Supabase Auth와 연동)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  nickname VARCHAR(50),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'staff', 'admin')),
  is_blacklisted BOOLEAN DEFAULT false,
  blacklist_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- 기기 종류 테이블
CREATE TABLE device_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL, -- 마이마이, 츄니즘, 발키리, 라이트닝
  total_count INTEGER NOT NULL DEFAULT 1,
  is_rentable BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 개별 기기 테이블 (번호 관리)
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_type_id UUID REFERENCES device_types(id) ON DELETE CASCADE,
  device_number INTEGER NOT NULL,
  location VARCHAR(100), -- 위치 정보 (입구쪽, 창가쪽 등)
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(device_type_id, device_number)
);

-- 기기별 시간대 슬롯 테이블
CREATE TABLE device_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  device_type_id UUID REFERENCES device_types(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  available_devices INTEGER[] NOT NULL, -- 예약 가능한 기기 번호 배열 [1, 2, 3]
  price INTEGER NOT NULL, -- 가격 (원)
  slot_type VARCHAR(20) DEFAULT 'regular' CHECK (slot_type IN ('regular', 'early', 'overnight', 'custom')),
  notes TEXT, -- "조기개장", "밤샘영업" 등
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, device_type_id, start_time, end_time)
);

-- 예약 테이블
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_time_slot_id UUID REFERENCES device_time_slots(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id),
  device_number INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  player_count INTEGER DEFAULT 1 CHECK (player_count IN (1, 2)), -- 마이마이 2P
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'checked_in', 'completed', 'cancelled')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  check_in_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'transfer')),
  payment_confirmed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 특별 영업 테이블 (조기개장, 밤샘영업)
CREATE TABLE special_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN ('early', 'overnight')),
  min_devices INTEGER DEFAULT 2, -- 최소 예약 대수
  is_confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 설정 테이블
CREATE TABLE settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- CMS 콘텐츠 섹션 테이블
CREATE TABLE content_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page VARCHAR(50) NOT NULL CHECK (page IN ('home', 'guide', 'rental')),
  section_type VARCHAR(50) NOT NULL,
  content JSONB NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
-- 사용자 활성 예약 조회 최적화
CREATE INDEX idx_user_active_reservations 
ON reservations(user_id, status) 
WHERE status IN ('pending', 'approved', 'checked_in');

-- 날짜별 시간대 슬롯 조회 최적화
CREATE INDEX idx_device_time_slots_date 
ON device_time_slots(date, device_type_id);

-- 기기 상태 조회 최적화
CREATE INDEX idx_devices_status 
ON devices(device_type_id, status, is_active);

-- 예약 상태별 조회 최적화
CREATE INDEX idx_reservations_status_date 
ON reservations(status, created_at);

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 적용
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_device_time_slots_updated_at BEFORE UPDATE ON device_time_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_sections_updated_at BEFORE UPDATE ON content_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();