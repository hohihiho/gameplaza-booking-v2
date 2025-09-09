-- GamePlaza V2 예약 규칙 테이블 생성
-- Supabase SQL Editor에서 실행해주세요
-- URL: https://supabase.com/dashboard/project/rupeyejnfurlcpgneekg/sql/new

-- 1. reservation_rules 테이블 생성
CREATE TABLE IF NOT EXISTS reservation_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 규칙 정보
  rule_name VARCHAR(100) NOT NULL,
  rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('general', 'payment', 'cancellation', 'youth_time')),
  rule_content TEXT NOT NULL,
  
  -- 표시 설정
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_reservation_rules_type ON reservation_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_reservation_rules_active ON reservation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_reservation_rules_order ON reservation_rules(display_order);

-- 3. RLS (Row Level Security) 활성화
ALTER TABLE reservation_rules ENABLE ROW LEVEL SECURITY;

-- 4. 기존 RLS 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "reservation_rules_public_read" ON reservation_rules;
DROP POLICY IF EXISTS "reservation_rules_authenticated_read" ON reservation_rules;
DROP POLICY IF EXISTS "reservation_rules_admin_all" ON reservation_rules;

-- 5. RLS 정책 생성
-- 모든 사용자가 활성화된 규칙을 읽을 수 있음
CREATE POLICY "reservation_rules_public_read" ON reservation_rules
  FOR SELECT TO anon
  USING (is_active = true);

-- 인증된 사용자는 모든 규칙을 읽을 수 있음
CREATE POLICY "reservation_rules_authenticated_read" ON reservation_rules
  FOR SELECT TO authenticated
  USING (true);

-- 관리자만 규칙을 수정할 수 있음 (임시로 모든 인증 사용자 허용)
CREATE POLICY "reservation_rules_admin_all" ON reservation_rules
  FOR ALL TO authenticated
  USING (true);

-- 6. 업데이트 시 updated_at 자동 갱신 트리거
DROP TRIGGER IF EXISTS update_reservation_rules_updated_at ON reservation_rules;
CREATE TRIGGER update_reservation_rules_updated_at
  BEFORE UPDATE ON reservation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 7. 샘플 데이터 삽입 (기존 데이터가 없는 경우에만)
INSERT INTO reservation_rules (rule_name, rule_type, rule_content, display_order, is_active) 
SELECT * FROM (VALUES
  ('예약 가능 시간', 'general', '예약은 오전 10시부터 오후 10시까지 가능합니다.', 1, true),
  ('예약 변경 및 취소', 'cancellation', '예약 변경 및 취소는 예약 시간 1시간 전까지 가능합니다.', 2, true),
  ('결제 안내', 'payment', '예약금은 현장에서 현금 또는 계좌이체로 결제 가능합니다.', 3, true),
  ('청소년 이용 시간', 'youth_time', '청소년은 평일 오후 10시, 주말 오후 11시까지 이용 가능합니다.', 4, true),
  ('본인 확인', 'general', '예약 시 본인 확인을 위해 신분증을 지참해 주세요.', 5, true),
  ('노쇼 정책', 'cancellation', '예약 시간 15분 경과 시 자동 취소되며, 3회 노쇼 시 예약이 제한됩니다.', 6, true),
  ('단체 예약', 'general', '5명 이상 단체 예약은 전화로 문의해 주세요.', 7, true)
) AS data(rule_name, rule_type, rule_content, display_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM reservation_rules LIMIT 1);

-- 8. 테이블 생성 확인
SELECT 
  'reservation_rules' as table_name,
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'reservation_rules'
ORDER BY ordinal_position;