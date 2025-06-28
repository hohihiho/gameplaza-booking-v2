-- 예약 전 확인사항(규칙) 테이블 생성
CREATE TABLE IF NOT EXISTS reservation_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_reservation_rules_active ON reservation_rules(is_active);
CREATE INDEX idx_reservation_rules_order ON reservation_rules(display_order);

-- RLS 정책
ALTER TABLE reservation_rules ENABLE ROW LEVEL SECURITY;

-- 누구나 활성화된 규칙을 읽을 수 있음
CREATE POLICY "reservation_rules_public_read" ON reservation_rules
  FOR SELECT USING (is_active = true);

-- 인증된 사용자(관리자)만 모든 작업 가능
CREATE POLICY "reservation_rules_admin_all" ON reservation_rules
  FOR ALL TO authenticated
  USING (true);

-- 업데이트 트리거
CREATE TRIGGER update_reservation_rules_updated_at
  BEFORE UPDATE ON reservation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 샘플 데이터 추가
INSERT INTO reservation_rules (content, display_order) VALUES
  ('예약한 시간에 맞춰 방문해주세요. 10분 이상 늦을 경우 예약이 자동 취소될 수 있습니다.', 1),
  ('본인 확인을 위해 신분증을 반드시 지참해주세요.', 2),
  ('예약 변경 및 취소는 이용 시간 1시간 전까지 가능합니다.', 3),
  ('기기는 소중히 다뤄주시고, 음식물 반입은 금지입니다.', 4),
  ('미성년자는 22시 이후 이용이 제한됩니다.', 5)
ON CONFLICT DO NOTHING;