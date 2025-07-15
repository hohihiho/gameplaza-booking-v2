-- phone_verified 컬럼 제거
-- 전화번호 인증 기능을 완전히 제거하고 단순 중복 확인만 사용

-- users 테이블에서 phone_verified 컬럼 제거
ALTER TABLE users DROP COLUMN IF EXISTS phone_verified CASCADE;

-- phone_verifications 테이블이 있다면 제거
DROP TABLE IF EXISTS phone_verifications CASCADE;

-- 관련 정책이나 함수가 있다면 제거
DROP FUNCTION IF EXISTS verify_phone_number CASCADE;
DROP FUNCTION IF EXISTS send_phone_verification CASCADE;

-- 코멘트 추가
COMMENT ON COLUMN users.phone IS '사용자 전화번호 (인증 없이 중복 확인만 수행)';