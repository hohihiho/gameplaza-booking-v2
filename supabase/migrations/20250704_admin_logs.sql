-- 관리자 활동 로그 테이블 (보안 강화)
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  admin_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_action ON admin_logs(action);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at DESC);

-- RLS 정책
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 로그 조회 가능
CREATE POLICY "Admins can view logs" ON admin_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- 로그는 시스템에서만 추가 (API 통해서만)
-- INSERT 정책 없음 = 클라이언트에서 직접 추가 불가

-- 사용 예시:
-- INSERT INTO admin_logs (admin_id, admin_email, action, target_type, target_id, details)
-- VALUES (
--   'admin-uuid',
--   'admin@example.com',
--   'DELETE_USER',
--   'users',
--   'deleted-user-uuid',
--   '{"reason": "spam account"}'::jsonb
-- );