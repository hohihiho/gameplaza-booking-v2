-- SMS 발송 한도 관리 테이블
CREATE TABLE IF NOT EXISTS sms_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  purpose TEXT DEFAULT 'verification', -- verification, welcome, reservation
  
  -- 인덱스를 위한 날짜 필드
  sent_date DATE DEFAULT CURRENT_DATE
);

-- 인덱스
CREATE INDEX idx_sms_limits_phone_date ON sms_limits(phone, sent_date);
CREATE INDEX idx_sms_limits_sent_at ON sms_limits(sent_at);

-- RLS 활성화
ALTER TABLE sms_limits ENABLE ROW LEVEL SECURITY;

-- 정책: Service role만 접근 가능
CREATE POLICY "Service role only" ON sms_limits
  FOR ALL
  USING (auth.role() = 'service_role');

-- 오래된 기록 자동 삭제 함수
CREATE OR REPLACE FUNCTION delete_old_sms_limits()
RETURNS void AS $$
BEGIN
  -- 7일 이상 된 기록 삭제
  DELETE FROM sms_limits WHERE sent_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- SMS 발송 한도 체크 함수
CREATE OR REPLACE FUNCTION check_sms_limit(
  p_phone TEXT,
  p_daily_limit INT DEFAULT 5,
  p_hourly_limit INT DEFAULT 2
)
RETURNS BOOLEAN AS $$
DECLARE
  daily_count INT;
  hourly_count INT;
BEGIN
  -- 일일 발송 횟수 확인
  SELECT COUNT(*) INTO daily_count
  FROM sms_limits
  WHERE phone = p_phone
    AND sent_date = CURRENT_DATE;
  
  IF daily_count >= p_daily_limit THEN
    RETURN FALSE;
  END IF;
  
  -- 시간당 발송 횟수 확인
  SELECT COUNT(*) INTO hourly_count
  FROM sms_limits
  WHERE phone = p_phone
    AND sent_at > NOW() - INTERVAL '1 hour';
  
  IF hourly_count >= p_hourly_limit THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;