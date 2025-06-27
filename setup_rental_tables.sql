-- GamePlaza V2 대여 시스템 테이블 생성
-- Supabase SQL Editor에서 실행해주세요

-- 1. rental_time_slots 테이블 생성
CREATE TABLE IF NOT EXISTS rental_time_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_type_id UUID NOT NULL REFERENCES device_types(id) ON DELETE CASCADE,
  
  -- 시간대 타입: early(조기대여), overnight(밤샘대여)
  slot_type TEXT NOT NULL CHECK (slot_type IN ('early', 'overnight')),
  
  -- 시간 설정
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- 크레딧 옵션별 시간별 가격
  -- JSON 형태: [{type: 'fixed'|'freeplay'|'unlimited', hours: [4,5], prices: {4: 30000, 5: 35000}, fixed_credits: 100}]
  credit_options JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- 2인 플레이 설정
  enable_2p BOOLEAN NOT NULL DEFAULT false,
  price_2p_extra INTEGER, -- 2인 플레이 추가 요금
  
  -- 청소년 시간대 여부
  is_youth_time BOOLEAN NOT NULL DEFAULT false,
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 복합 유니크 제약 (같은 기기에 시간대가 겹치지 않도록)
  CONSTRAINT valid_time_range CHECK (
    (slot_type = 'early' AND start_time < end_time) OR 
    (slot_type = 'overnight' AND (start_time > end_time OR start_time = end_time))
  )
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_rental_time_slots_device_type ON rental_time_slots(device_type_id);
CREATE INDEX IF NOT EXISTS idx_rental_time_slots_slot_type ON rental_time_slots(slot_type);
CREATE INDEX IF NOT EXISTS idx_rental_time_slots_time ON rental_time_slots(start_time, end_time);

-- 3. rental_settings 테이블 생성
CREATE TABLE IF NOT EXISTS rental_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_type_id UUID NOT NULL UNIQUE REFERENCES device_types(id) ON DELETE CASCADE,
  
  -- 대여 가능 대수 (전체 보유 대수 중 동시에 대여 가능한 대수)
  max_rental_units INTEGER,
  
  -- 기본 대여 설정
  min_rental_hours INTEGER NOT NULL DEFAULT 1,
  max_rental_hours INTEGER NOT NULL DEFAULT 24,
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_rental_settings_device_type ON rental_settings(device_type_id);

-- 5. device_types에 rental_settings 컬럼 추가
ALTER TABLE device_types 
ADD COLUMN IF NOT EXISTS rental_settings JSONB DEFAULT '{}'::jsonb;

-- 6. RLS (Row Level Security) 정책 설정
ALTER TABLE rental_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_settings ENABLE ROW LEVEL SECURITY;

-- 관리자만 수정 가능
CREATE POLICY "rental_time_slots_admin_all" ON rental_time_slots
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 일반 사용자는 조회만 가능
CREATE POLICY "rental_time_slots_public_read" ON rental_time_slots
  FOR SELECT TO authenticated
  USING (true);

-- rental_settings도 동일한 정책 적용
CREATE POLICY "rental_settings_admin_all" ON rental_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "rental_settings_public_read" ON rental_settings
  FOR SELECT TO authenticated
  USING (true);

-- 7. 업데이트 시 updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rental_time_slots_updated_at
  BEFORE UPDATE ON rental_time_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_rental_settings_updated_at
  BEFORE UPDATE ON rental_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 8. 테스트 데이터 (선택사항)
-- INSERT INTO rental_time_slots (device_type_id, slot_type, start_time, end_time, credit_options, enable_2p, price_2p_extra, is_youth_time)
-- SELECT 
--   id,
--   'early',
--   '10:00',
--   '18:00',
--   '[
--     {
--       "type": "fixed",
--       "hours": [4, 5],
--       "prices": {"4": 25000, "5": 30000},
--       "fixed_credits": 100
--     },
--     {
--       "type": "freeplay",
--       "hours": [4, 5],
--       "prices": {"4": 30000, "5": 35000}
--     }
--   ]'::jsonb,
--   true,
--   10000,
--   true
-- FROM device_types
-- WHERE is_rentable = true
-- LIMIT 1;