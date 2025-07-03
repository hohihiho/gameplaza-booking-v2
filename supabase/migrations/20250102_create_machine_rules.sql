-- 기기 현황 안내사항 테이블 생성
CREATE TABLE IF NOT EXISTS machine_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_machine_rules_active ON machine_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_machine_rules_order ON machine_rules(display_order);

-- RLS 정책 설정
ALTER TABLE machine_rules ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 설정 (활성화된 규칙만)
CREATE POLICY "Anyone can view active machine rules" ON machine_rules
  FOR SELECT
  USING (is_active = true);

-- 관리자만 생성/수정/삭제 가능
CREATE POLICY "Admins can manage all machine rules" ON machine_rules
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 초기 데이터 삽입 (없는 경우에만)
INSERT INTO machine_rules (content, display_order)
SELECT content, display_order FROM (
  VALUES 
    ('실시간 상태는 약 1분마다 업데이트됩니다', 1),
    ('대여 예약은 마이마이, 츄니즘, 발키리, 라이트닝만 가능합니다', 2),
    ('점검 중인 기기는 일시적으로 이용할 수 없습니다', 3),
    ('일반 이용은 현장에서 바로 가능합니다', 4)
) AS initial_data(content, display_order)
WHERE NOT EXISTS (SELECT 1 FROM machine_rules LIMIT 1);