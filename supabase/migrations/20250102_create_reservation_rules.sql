-- 예약 규칙 테이블 생성
CREATE TABLE IF NOT EXISTS reservation_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_reservation_rules_active ON reservation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_reservation_rules_order ON reservation_rules(display_order);

-- RLS 정책 설정
ALTER TABLE reservation_rules ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 설정 (활성화된 규칙만)
CREATE POLICY "Anyone can view active rules" ON reservation_rules
  FOR SELECT
  USING (is_active = true);

-- 관리자만 생성/수정/삭제 가능
CREATE POLICY "Admins can manage all rules" ON reservation_rules
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 초기 데이터 삽입 (없는 경우에만)
INSERT INTO reservation_rules (content, display_order)
SELECT content, display_order FROM (
  VALUES 
    ('예약한 시간에 맞춰 방문해주세요. 10분 이상 늦을 경우 예약이 자동 취소될 수 있습니다.', 1),
    ('본인 확인을 위해 신분증을 반드시 지참해주세요.', 2),
    ('예약 변경 및 취소는 이용 시간 24시간 전까지 가능합니다.', 3),
    ('기기는 소중히 다뤄주시고, 음식물 반입은 금지입니다.', 4),
    ('미성년자는 22시 이후 이용이 제한됩니다.', 5)
) AS initial_data(content, display_order)
WHERE NOT EXISTS (SELECT 1 FROM reservation_rules LIMIT 1);