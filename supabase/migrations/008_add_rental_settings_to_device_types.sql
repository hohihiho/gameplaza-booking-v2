-- device_types 테이블에 rental_settings JSONB 컬럼 추가
ALTER TABLE device_types 
ADD COLUMN IF NOT EXISTS rental_settings JSONB DEFAULT '{}'::jsonb;

-- 기존 데이터에 기본값 설정
UPDATE device_types 
SET rental_settings = jsonb_build_object(
  'credit_types', ARRAY['freeplay', 'unlimited']::text[],
  'max_players', 1,
  'max_rental_units', total_count
)
WHERE rental_settings = '{}'::jsonb;