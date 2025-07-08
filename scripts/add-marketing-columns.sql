-- users 테이블에 마케팅 동의 컬럼 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS marketing_agreed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS marketing_agreed_at TIMESTAMP WITH TIME ZONE;

-- 인덱스 추가 (마케팅 대상 사용자 조회용)
CREATE INDEX IF NOT EXISTS idx_users_marketing_agreed 
ON users(marketing_agreed) 
WHERE marketing_agreed = true;