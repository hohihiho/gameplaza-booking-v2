-- Better Auth를 위한 users 테이블 필드 추가
-- 기존 profile_image_url을 image로 매핑하고 email_verified 필드 추가

-- 이메일 인증 상태 필드 추가
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;

-- Better Auth 표준 image 필드 추가 (기존 profile_image_url과 별도 관리)
ALTER TABLE users ADD COLUMN image TEXT;

-- 인덱스 추가
CREATE INDEX idx_users_email_verified ON users(email_verified);