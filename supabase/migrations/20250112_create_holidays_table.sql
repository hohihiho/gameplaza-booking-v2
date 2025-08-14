-- 공휴일 테이블 생성
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('official', 'temporary', 'substitute')),
  is_red_day BOOLEAN DEFAULT true,
  year INTEGER NOT NULL,
  source VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('api', 'manual')),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES admins(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, name)
);

-- 인덱스 생성
CREATE INDEX idx_holidays_year ON holidays(year);
CREATE INDEX idx_holidays_date ON holidays(date);
CREATE INDEX idx_holidays_type ON holidays(type);

-- RLS 정책
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 공휴일을 조회할 수 있음
CREATE POLICY "Anyone can view holidays"
  ON holidays FOR SELECT
  USING (true);

-- 관리자만 공휴일을 추가/수정/삭제할 수 있음
CREATE POLICY "Admins can manage holidays"
  ON holidays FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
    )
  );

-- 업데이트 시각 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_holidays_updated_at
  BEFORE UPDATE ON holidays
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2025년 기본 공휴일 데이터 삽입 (나중에 API로 대체 예정)
INSERT INTO holidays (name, date, type, year, source) VALUES
  ('신정', '2025-01-01', 'official', 2025, 'manual'),
  ('설날 연휴', '2025-01-28', 'official', 2025, 'manual'),
  ('설날', '2025-01-29', 'official', 2025, 'manual'),
  ('설날 연휴', '2025-01-30', 'official', 2025, 'manual'),
  ('삼일절', '2025-03-01', 'official', 2025, 'manual'),
  ('어린이날', '2025-05-05', 'official', 2025, 'manual'),
  ('어린이날 대체공휴일', '2025-05-06', 'substitute', 2025, 'manual'),
  ('부처님오신날', '2025-05-05', 'official', 2025, 'manual'),
  ('현충일', '2025-06-06', 'official', 2025, 'manual'),
  ('광복절', '2025-08-15', 'official', 2025, 'manual'),
  ('추석 연휴', '2025-10-05', 'official', 2025, 'manual'),
  ('추석', '2025-10-06', 'official', 2025, 'manual'),
  ('추석 연휴', '2025-10-07', 'official', 2025, 'manual'),
  ('추석 대체공휴일', '2025-10-08', 'substitute', 2025, 'manual'),
  ('개천절', '2025-10-03', 'official', 2025, 'manual'),
  ('한글날', '2025-10-09', 'official', 2025, 'manual'),
  ('성탄절', '2025-12-25', 'official', 2025, 'manual')
ON CONFLICT (date, name) DO NOTHING;

-- 뷰 생성: 이번 달과 다음 달 공휴일
CREATE OR REPLACE VIEW upcoming_holidays AS
SELECT * FROM holidays
WHERE date >= CURRENT_DATE
  AND date <= CURRENT_DATE + INTERVAL '2 months'
ORDER BY date;

COMMENT ON TABLE holidays IS '한국 공휴일 정보를 저장하는 테이블';
COMMENT ON COLUMN holidays.type IS 'official: 법정공휴일, temporary: 임시공휴일, substitute: 대체공휴일';
COMMENT ON COLUMN holidays.source IS 'api: 공공데이터 API, manual: 수동 입력';