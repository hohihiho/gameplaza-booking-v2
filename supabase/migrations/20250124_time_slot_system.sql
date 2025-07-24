-- 시간대 템플릿 테이블
CREATE TABLE IF NOT EXISTS time_slot_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('early', 'overnight')),
  start_hour INTEGER NOT NULL CHECK (start_hour >= 0 AND start_hour <= 29),
  end_hour INTEGER NOT NULL CHECK (end_hour >= 1 AND end_hour <= 30),
  credit_options JSONB NOT NULL,
  enable_2p BOOLEAN NOT NULL DEFAULT false,
  price_2p_extra INTEGER,
  is_youth_time BOOLEAN NOT NULL DEFAULT false,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 시간 유효성 검증
  CONSTRAINT valid_time_range CHECK (end_hour > start_hour),
  -- 2인 플레이 검증
  CONSTRAINT valid_2p_price CHECK (
    (NOT enable_2p) OR (enable_2p AND price_2p_extra IS NOT NULL AND price_2p_extra >= 0)
  )
);

-- 인덱스
CREATE INDEX idx_time_slot_templates_type ON time_slot_templates(type);
CREATE INDEX idx_time_slot_templates_active ON time_slot_templates(is_active);
CREATE INDEX idx_time_slot_templates_priority ON time_slot_templates(priority DESC);

-- 시간대 충돌 검증 함수
CREATE OR REPLACE FUNCTION check_time_slot_conflict()
RETURNS TRIGGER AS $$
BEGIN
  -- 같은 타입의 활성화된 템플릿 중 시간이 겹치는지 확인
  IF EXISTS (
    SELECT 1 FROM time_slot_templates
    WHERE id != NEW.id
      AND type = NEW.type
      AND is_active = true
      AND NEW.is_active = true
      AND (
        (NEW.start_hour < end_hour AND NEW.end_hour > start_hour)
      )
  ) THEN
    RAISE EXCEPTION '시간대가 겹치는 템플릿이 있습니다';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER check_time_slot_conflict_trigger
BEFORE INSERT OR UPDATE ON time_slot_templates
FOR EACH ROW
EXECUTE FUNCTION check_time_slot_conflict();

-- 시간대 스케줄 테이블
CREATE TABLE IF NOT EXISTS time_slot_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  device_type_id UUID NOT NULL REFERENCES device_types(id) ON DELETE CASCADE,
  template_ids UUID[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 날짜와 기기 타입 조합은 유니크
  CONSTRAINT unique_date_device_type UNIQUE (date, device_type_id)
);

-- 인덱스
CREATE INDEX idx_time_slot_schedules_date ON time_slot_schedules(date);
CREATE INDEX idx_time_slot_schedules_device_type ON time_slot_schedules(device_type_id);
CREATE INDEX idx_time_slot_schedules_template_ids ON time_slot_schedules USING GIN(template_ids);

-- 과거 날짜 검증 함수
CREATE OR REPLACE FUNCTION check_schedule_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date < CURRENT_DATE THEN
    RAISE EXCEPTION '과거 날짜에 대한 스케줄은 설정할 수 없습니다';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER check_schedule_date_trigger
BEFORE INSERT OR UPDATE ON time_slot_schedules
FOR EACH ROW
EXECUTE FUNCTION check_schedule_date();

-- 템플릿 존재 검증 함수
CREATE OR REPLACE FUNCTION check_template_exists()
RETURNS TRIGGER AS $$
DECLARE
  template_id UUID;
  missing_ids UUID[];
BEGIN
  -- 모든 템플릿 ID가 존재하는지 확인
  FOREACH template_id IN ARRAY NEW.template_ids
  LOOP
    IF NOT EXISTS (SELECT 1 FROM time_slot_templates WHERE id = template_id) THEN
      missing_ids := array_append(missing_ids, template_id);
    END IF;
  END LOOP;
  
  IF array_length(missing_ids, 1) > 0 THEN
    RAISE EXCEPTION '존재하지 않는 템플릿 ID: %', missing_ids;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER check_template_exists_trigger
BEFORE INSERT OR UPDATE ON time_slot_schedules
FOR EACH ROW
EXECUTE FUNCTION check_template_exists();

-- 업데이트 타임스탬프 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 타임스탬프 트리거
CREATE TRIGGER update_time_slot_templates_updated_at
BEFORE UPDATE ON time_slot_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_slot_schedules_updated_at
BEFORE UPDATE ON time_slot_schedules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS 정책
ALTER TABLE time_slot_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slot_schedules ENABLE ROW LEVEL SECURITY;

-- 시간대 템플릿 정책
-- 모든 인증된 사용자가 조회 가능
CREATE POLICY "time_slot_templates_select_policy" ON time_slot_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- 관리자만 생성/수정/삭제 가능
CREATE POLICY "time_slot_templates_insert_policy" ON time_slot_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "time_slot_templates_update_policy" ON time_slot_templates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "time_slot_templates_delete_policy" ON time_slot_templates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 시간대 스케줄 정책
-- 모든 인증된 사용자가 조회 가능
CREATE POLICY "time_slot_schedules_select_policy" ON time_slot_schedules
  FOR SELECT
  TO authenticated
  USING (true);

-- 관리자만 생성/수정/삭제 가능
CREATE POLICY "time_slot_schedules_insert_policy" ON time_slot_schedules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "time_slot_schedules_update_policy" ON time_slot_schedules
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "time_slot_schedules_delete_policy" ON time_slot_schedules
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 샘플 데이터 (개발 환경용)
-- INSERT INTO time_slot_templates (name, description, type, start_hour, end_hour, credit_options, enable_2p, price_2p_extra, is_youth_time, priority) VALUES
-- ('조기대여 오전', '오전 10시-14시 대여', 'early', 10, 14, 
--   '[{"type": "fixed", "hours": [4], "prices": {"4": 25000}, "fixedCredits": 100}, 
--     {"type": "freeplay", "hours": [4], "prices": {"4": 30000}}]'::jsonb, 
--   true, 10000, true, 10),
-- ('조기대여 오후', '오후 14시-18시 대여', 'early', 14, 18, 
--   '[{"type": "fixed", "hours": [4], "prices": {"4": 28000}, "fixedCredits": 150}, 
--     {"type": "freeplay", "hours": [4], "prices": {"4": 33000}}]'::jsonb, 
--   true, 10000, true, 9),
-- ('밤샘대여 단시간', '22시-26시 대여', 'overnight', 22, 26, 
--   '[{"type": "freeplay", "hours": [4], "prices": {"4": 40000}}]'::jsonb, 
--   false, NULL, false, 8),
-- ('밤샘대여 장시간', '22시-29시 대여', 'overnight', 22, 29, 
--   '[{"type": "freeplay", "hours": [7], "prices": {"7": 60000}}, 
--     {"type": "unlimited", "hours": [7], "prices": {"7": 70000}}]'::jsonb, 
--   false, NULL, false, 7);