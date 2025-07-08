-- 전화번호 변경 추적을 위한 컬럼 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_changed_at TIMESTAMP WITH TIME ZONE;

-- 기존 사용자들의 phone_changed_at을 NULL로 설정 (제한 없이 첫 변경 가능)
UPDATE users 
SET phone_changed_at = NULL 
WHERE phone_changed_at IS NULL;

-- 인덱스 추가 (옵션)
CREATE INDEX IF NOT EXISTS idx_users_phone_changed_at 
ON users(phone_changed_at);

COMMENT ON COLUMN users.phone_changed_at IS '마지막 전화번호 변경 시간 (한 달에 한 번 제한)';