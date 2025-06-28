-- rental_time_slots 테이블을 애플리케이션에 맞게 재구성
-- 날짜별 시간대 관리를 위한 구조로 변경

-- 1. 기존 테이블 백업
ALTER TABLE IF EXISTS rental_time_slots RENAME TO rental_time_slots_backup;

-- 2. 새로운 구조로 테이블 생성
CREATE TABLE rental_time_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_type_id UUID NOT NULL REFERENCES device_types(id) ON DELETE CASCADE,
  
  -- 날짜 기반 관리
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- 사용 가능한 기기 번호들
  available_units INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4],
  max_units INTEGER NOT NULL DEFAULT 4,
  
  -- 가격 정보
  price INTEGER NOT NULL DEFAULT 50000, -- 기본 가격
  credit_options JSONB DEFAULT '[]'::jsonb, -- 크레딧 타입별 가격
  
  -- 추가 설정
  slot_type TEXT DEFAULT 'regular' CHECK (slot_type IN ('early', 'overnight', 'regular')),
  is_active BOOLEAN DEFAULT true,
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 중복 방지
  CONSTRAINT unique_device_date_time_slot UNIQUE (device_type_id, date, start_time, end_time)
);

-- 3. 인덱스 생성
CREATE INDEX idx_rental_time_slots_device_type ON rental_time_slots(device_type_id);
CREATE INDEX idx_rental_time_slots_date ON rental_time_slots(date);
CREATE INDEX idx_rental_time_slots_active ON rental_time_slots(is_active);

-- 4. RLS 정책
ALTER TABLE rental_time_slots ENABLE ROW LEVEL SECURITY;

-- 누구나 읽을 수 있음
CREATE POLICY "rental_time_slots_public_read" ON rental_time_slots
  FOR SELECT USING (true);

-- 인증된 사용자만 수정 가능
CREATE POLICY "rental_time_slots_admin_all" ON rental_time_slots
  FOR ALL TO authenticated
  USING (true);

-- 5. 업데이트 트리거
CREATE TRIGGER update_rental_time_slots_updated_at
  BEFORE UPDATE ON rental_time_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 6. 기존 백업 테이블 삭제 (확인 후)
-- DROP TABLE IF EXISTS rental_time_slots_backup;