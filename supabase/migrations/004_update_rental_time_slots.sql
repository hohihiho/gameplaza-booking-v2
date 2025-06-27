-- rental_time_slots 테이블 수정
-- 날짜별이 아닌 시간대별 가격 설정으로 변경

-- 기존 테이블 삭제 (데이터가 없다고 가정)
DROP TABLE IF EXISTS rental_time_slots;

-- 새로운 구조로 생성
CREATE TABLE rental_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_type_id UUID NOT NULL REFERENCES device_types(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  prices JSONB NOT NULL DEFAULT '{}', -- {fixed: 50000, freeplay: 60000, unlimited: 70000}
  player_prices JSONB, -- {one_player: 30000, two_player: 40000} - 2인 플레이 가능한 기기용
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(device_type_id, start_time, end_time)
);

-- 인덱스 생성
CREATE INDEX idx_rental_time_slots_device_type ON rental_time_slots(device_type_id);
CREATE INDEX idx_rental_time_slots_active ON rental_time_slots(is_active);

-- RLS 정책
ALTER TABLE rental_time_slots ENABLE ROW LEVEL SECURITY;

-- 누구나 읽을 수 있음
CREATE POLICY "Anyone can view rental time slots" ON rental_time_slots FOR SELECT USING (true);

-- 관리자만 수정 가능 (추후 구현)
-- CREATE POLICY "Admins can manage rental time slots" ON rental_time_slots FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rental_time_slots_updated_at BEFORE UPDATE ON rental_time_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();