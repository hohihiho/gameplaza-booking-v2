-- 기기 카테고리 테이블 (SEGA, KONAMI 등)
CREATE TABLE IF NOT EXISTS device_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 기기 타입 테이블 (마이마이 DX, 사운드 볼텍스 등)
CREATE TABLE IF NOT EXISTS device_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES device_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_rentable BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 플레이 모드 테이블 (스탠다드, DX 등)
CREATE TABLE IF NOT EXISTS play_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_type_id UUID NOT NULL REFERENCES device_types(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 대여 설정 테이블
CREATE TABLE IF NOT EXISTS rental_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_type_id UUID NOT NULL REFERENCES device_types(id) ON DELETE CASCADE,
  base_price INTEGER NOT NULL DEFAULT 0,
  credit_types TEXT[] NOT NULL DEFAULT '{}', -- 'fixed', 'freeplay', 'unlimited' 배열
  fixed_credits INTEGER,
  max_players INTEGER NOT NULL DEFAULT 1,
  price_multiplier_2p DECIMAL(3,2) DEFAULT 1.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(device_type_id)
);

-- 개별 기기 테이블
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_type_id UUID NOT NULL REFERENCES device_types(id) ON DELETE CASCADE,
  device_number INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'broken')),
  notes TEXT,
  last_maintenance DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(device_type_id, device_number)
);

-- 대여 시간대 테이블
CREATE TABLE IF NOT EXISTS rental_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_type_id UUID NOT NULL REFERENCES device_types(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  available_device_numbers INTEGER[] NOT NULL DEFAULT '{}',
  prices JSONB NOT NULL DEFAULT '{}', -- {fixed: 50000, freeplay: 60000, unlimited: 70000}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(device_type_id, date, start_time)
);

-- 인덱스 생성
CREATE INDEX idx_device_types_category ON device_types(category_id);
CREATE INDEX idx_devices_type ON devices(device_type_id);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_rental_slots_date ON rental_time_slots(date);
CREATE INDEX idx_rental_slots_device_type ON rental_time_slots(device_type_id);

-- RLS 정책
ALTER TABLE device_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_time_slots ENABLE ROW LEVEL SECURITY;

-- 누구나 읽을 수 있지만, 관리자만 수정 가능
CREATE POLICY "Anyone can view categories" ON device_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view device types" ON device_types FOR SELECT USING (true);
CREATE POLICY "Anyone can view play modes" ON play_modes FOR SELECT USING (true);
CREATE POLICY "Anyone can view rental settings" ON rental_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can view devices" ON devices FOR SELECT USING (true);
CREATE POLICY "Anyone can view rental slots" ON rental_time_slots FOR SELECT USING (true);

-- 관리자 권한은 나중에 추가 (auth.users 연동 후)