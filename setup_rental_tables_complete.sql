-- GamePlaza V2 대여 시스템 테이블 생성
-- Supabase SQL Editor에서 실행해주세요
-- URL: https://supabase.com/dashboard/project/rupeyejnfurlcpgneekg/sql/new

-- 1. 기존 테이블 삭제 (필요한 경우만)
-- DROP TABLE IF EXISTS rental_time_slots CASCADE;
-- DROP TABLE IF EXISTS rental_settings CASCADE;

-- 2. rental_time_slots 테이블 생성
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_rental_time_slots_device_type ON rental_time_slots(device_type_id);
CREATE INDEX IF NOT EXISTS idx_rental_time_slots_slot_type ON rental_time_slots(slot_type);
CREATE INDEX IF NOT EXISTS idx_rental_time_slots_time ON rental_time_slots(start_time, end_time);

-- 4. rental_settings 테이블 생성
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

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_rental_settings_device_type ON rental_settings(device_type_id);

-- 6. device_types에 rental_settings 컬럼 추가
ALTER TABLE device_types 
ADD COLUMN IF NOT EXISTS rental_settings JSONB DEFAULT '{}'::jsonb;

-- 7. RLS (Row Level Security) 활성화
ALTER TABLE rental_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_settings ENABLE ROW LEVEL SECURITY;

-- 8. 기존 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "rental_time_slots_admin_all" ON rental_time_slots;
DROP POLICY IF EXISTS "rental_time_slots_public_read" ON rental_time_slots;
DROP POLICY IF EXISTS "rental_settings_admin_all" ON rental_settings;
DROP POLICY IF EXISTS "rental_settings_public_read" ON rental_settings;

-- 9. RLS 정책 생성 (임시로 모든 인증 사용자 허용)
CREATE POLICY "rental_time_slots_admin_all" ON rental_time_slots
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "rental_time_slots_public_read" ON rental_time_slots
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "rental_settings_admin_all" ON rental_settings
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "rental_settings_public_read" ON rental_settings
  FOR SELECT TO anon
  USING (true);

-- 10. 업데이트 시 updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. 기존 트리거 삭제 (있을 경우)
DROP TRIGGER IF EXISTS update_rental_time_slots_updated_at ON rental_time_slots;
DROP TRIGGER IF EXISTS update_rental_settings_updated_at ON rental_settings;

-- 12. 트리거 생성
CREATE TRIGGER update_rental_time_slots_updated_at
  BEFORE UPDATE ON rental_time_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_rental_settings_updated_at
  BEFORE UPDATE ON rental_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 13. 테이블 생성 확인
SELECT 
  'rental_time_slots' as table_name,
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'rental_time_slots'
ORDER BY ordinal_position;