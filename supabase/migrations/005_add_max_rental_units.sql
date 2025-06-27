-- rental_settings 테이블에 대여 가능 대수 관련 컬럼 추가

-- max_rental_units: 동시에 대여 가능한 최대 대수
-- total_units: 전체 보유 대수 (devices 테이블에서 집계하여 표시)
ALTER TABLE rental_settings 
ADD COLUMN IF NOT EXISTS max_rental_units INTEGER;

-- 기본값 설정: NULL인 경우 전체 기기 대여 가능
UPDATE rental_settings 
SET max_rental_units = NULL 
WHERE max_rental_units IS NULL;

-- 코멘트 추가
COMMENT ON COLUMN rental_settings.max_rental_units IS '동시에 대여 가능한 최대 대수. NULL인 경우 전체 기기 대여 가능';