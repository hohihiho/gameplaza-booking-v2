-- 기존 테이블 구조 확인 및 수정
-- Supabase SQL Editor에서 단계별로 실행해주세요

-- 1단계: 현재 테이블 구조 확인
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'rental_time_slots'
ORDER BY ordinal_position;

-- 2단계: 기존 데이터 백업 (필요한 경우)
-- CREATE TABLE rental_time_slots_backup AS SELECT * FROM rental_time_slots;

-- 3단계: 기존 테이블과 관련 정책 삭제
DROP TABLE IF EXISTS rental_time_slots CASCADE;
DROP TABLE IF EXISTS rental_settings CASCADE;

-- 4단계: 새 테이블 생성
CREATE TABLE rental_time_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_type_id UUID NOT NULL REFERENCES device_types(id) ON DELETE CASCADE,
  
  -- 시간대 타입: early(조기대여), overnight(밤샘대여)
  slot_type TEXT NOT NULL CHECK (slot_type IN ('early', 'overnight')),
  
  -- 시간 설정
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- 크레딧 옵션별 시간별 가격
  credit_options JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- 2인 플레이 설정
  enable_2p BOOLEAN NOT NULL DEFAULT false,
  price_2p_extra INTEGER,
  
  -- 청소년 시간대 여부
  is_youth_time BOOLEAN NOT NULL DEFAULT false,
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5단계: rental_settings 테이블 생성
CREATE TABLE rental_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_type_id UUID NOT NULL UNIQUE REFERENCES device_types(id) ON DELETE CASCADE,
  max_rental_units INTEGER,
  min_rental_hours INTEGER NOT NULL DEFAULT 1,
  max_rental_hours INTEGER NOT NULL DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6단계: 인덱스 생성
CREATE INDEX idx_rental_time_slots_device_type ON rental_time_slots(device_type_id);
CREATE INDEX idx_rental_time_slots_slot_type ON rental_time_slots(slot_type);
CREATE INDEX idx_rental_time_slots_time ON rental_time_slots(start_time, end_time);
CREATE INDEX idx_rental_settings_device_type ON rental_settings(device_type_id);

-- 7단계: device_types 테이블에 컬럼 추가
ALTER TABLE device_types 
ADD COLUMN IF NOT EXISTS rental_settings JSONB DEFAULT '{}'::jsonb;

-- 8단계: RLS 활성화
ALTER TABLE rental_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_settings ENABLE ROW LEVEL SECURITY;

-- 9단계: RLS 정책 생성
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

-- 10단계: 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11단계: 트리거 생성
CREATE TRIGGER update_rental_time_slots_updated_at
  BEFORE UPDATE ON rental_time_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_rental_settings_updated_at
  BEFORE UPDATE ON rental_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 12단계: 테이블 생성 확인
SELECT 
  table_name,
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('rental_time_slots', 'rental_settings')
ORDER BY table_name, ordinal_position;