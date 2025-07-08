-- 전화번호 인증 코드 관리 테이블
CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  user_email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_phone_verifications_phone ON phone_verifications(phone);
CREATE INDEX idx_phone_verifications_expires ON phone_verifications(expires_at);

-- RLS 활성화
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;

-- 정책: Service role만 접근 가능 (보안)
CREATE POLICY "Service role only" ON phone_verifications
  FOR ALL
  USING (auth.role() = 'service_role');

-- 만료된 인증 코드 자동 삭제를 위한 함수
CREATE OR REPLACE FUNCTION delete_expired_phone_verifications()
RETURNS void AS $$
BEGIN
  DELETE FROM phone_verifications WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 주기적으로 만료된 코드 삭제 (옵션)
-- pg_cron 확장이 필요합니다
-- SELECT cron.schedule('delete-expired-verifications', '*/10 * * * *', 'SELECT delete_expired_phone_verifications();');