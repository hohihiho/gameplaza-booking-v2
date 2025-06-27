-- rental_time_slots 테이블 수정
-- 시간대별로 자동 계산된 크레딧 옵션과 가격을 저장

-- 기존 테이블 백업
ALTER TABLE rental_time_slots RENAME TO rental_time_slots_old;

-- 새로운 구조로 테이블 생성
CREATE TABLE rental_time_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_type_id UUID NOT NULL REFERENCES device_types(id) ON DELETE CASCADE,
  
  -- 시간대 타입: early(조기대여), overnight(밤샘대여)
  slot_type TEXT NOT NULL CHECK (slot_type IN ('early', 'overnight')),
  
  -- 시간 설정
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- 시간대별 크레딧 옵션과 가격 (단순화된 구조)
  -- JSON 형태: [{type: 'fixed'|'freeplay'|'unlimited', price: 30000, fixed_credits: 100}]
  credit_options JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- 2인 플레이 설정
  enable_2p BOOLEAN NOT NULL DEFAULT false,
  price_2p_extra INTEGER, -- 2인 플레이 추가 요금
  
  -- 청소년 시간대 여부
  is_youth_time BOOLEAN NOT NULL DEFAULT false,
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 시간대 겹침 방지 (같은 기기, 같은 타입의 시간대는 겹치면 안됨)
  CONSTRAINT no_time_overlap UNIQUE (device_type_id, slot_type, start_time, end_time)
);

-- 인덱스 생성
CREATE INDEX idx_rental_time_slots_device_type ON rental_time_slots(device_type_id);
CREATE INDEX idx_rental_time_slots_slot_type ON rental_time_slots(slot_type);
CREATE INDEX idx_rental_time_slots_time ON rental_time_slots(start_time, end_time);

-- RLS 정책 재생성
ALTER TABLE rental_time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rental_time_slots_admin_all" ON rental_time_slots
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "rental_time_slots_public_read" ON rental_time_slots
  FOR SELECT TO anon
  USING (true);

-- 트리거 재생성
CREATE TRIGGER update_rental_time_slots_updated_at
  BEFORE UPDATE ON rental_time_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 기존 데이터 마이그레이션 (있다면)
-- INSERT INTO rental_time_slots (device_type_id, slot_type, start_time, end_time, credit_options, enable_2p, price_2p_extra, is_youth_time)
-- SELECT 
--   device_type_id,
--   slot_type,
--   start_time,
--   end_time,
--   credit_options,
--   enable_2p,
--   price_2p_extra,
--   is_youth_time
-- FROM rental_time_slots_old;

-- 기존 테이블 삭제 (확인 후)
-- DROP TABLE rental_time_slots_old;