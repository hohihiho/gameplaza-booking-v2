-- 운영 일정 관리 테이블
CREATE TABLE IF NOT EXISTS schedule_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  end_date DATE, -- 기간 설정시 사용
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('special', 'early_open', 'overnight', 'early_close', 'event', 'reservation_block')),
  description TEXT,
  start_time TIME,
  end_time TIME,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_type VARCHAR(20) CHECK (recurring_type IN ('weekly', 'monthly')),
  affects_reservation BOOLEAN DEFAULT TRUE,
  block_type VARCHAR(20) CHECK (block_type IN ('early', 'overnight', 'all_day')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 날짜 인덱스 (빠른 조회를 위해)
CREATE INDEX idx_schedule_events_date ON schedule_events(date);
CREATE INDEX idx_schedule_events_date_range ON schedule_events(date, end_date);
CREATE INDEX idx_schedule_events_type ON schedule_events(type);

-- RLS 정책
ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;

-- 관리자만 생성/수정/삭제 가능
CREATE POLICY "Admin can manage schedule events" ON schedule_events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = TRUE
    )
  );

-- 모든 사용자가 조회 가능 (예약 시 일정 확인용)
CREATE POLICY "Everyone can view schedule events" ON schedule_events
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_schedule_events_updated_at 
  BEFORE UPDATE ON schedule_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 예약 시스템과의 연동을 위한 함수 (특정 날짜의 운영 상태 확인)
CREATE OR REPLACE FUNCTION check_schedule_status(check_date DATE)
RETURNS TABLE (
  has_special_hours BOOLEAN,
  is_closed BOOLEAN,
  special_start_time TIME,
  special_end_time TIME,
  event_types TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) > 0 AS has_special_hours,
    EXISTS(
      SELECT 1 
      FROM schedule_events se 
      WHERE se.date = check_date 
      AND se.type = 'reservation_block'
      AND se.affects_reservation = TRUE
    ) AS is_closed,
    MIN(CASE WHEN se.start_time IS NOT NULL THEN se.start_time END) AS special_start_time,
    MAX(CASE WHEN se.end_time IS NOT NULL THEN se.end_time END) AS special_end_time,
    ARRAY_AGG(DISTINCT se.type) AS event_types
  FROM schedule_events se
  WHERE se.date = check_date
  OR (se.date <= check_date AND se.end_date >= check_date);
END;
$$ LANGUAGE plpgsql;