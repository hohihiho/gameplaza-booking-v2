-- rental_time_slots 테이블에 date 컬럼 추가 및 데이터 정리

-- 1. date 컬럼 추가 (없다면)
ALTER TABLE rental_time_slots ADD COLUMN IF NOT EXISTS date DATE;

-- 2. available_units 컬럼 추가 (없다면) 
ALTER TABLE rental_time_slots ADD COLUMN IF NOT EXISTS available_units INTEGER[] DEFAULT ARRAY[1,2,3,4];

-- 3. max_units 컬럼 추가 (없다면)
ALTER TABLE rental_time_slots ADD COLUMN IF NOT EXISTS max_units INTEGER DEFAULT 4;

-- 4. price 컬럼 추가 (없다면)
ALTER TABLE rental_time_slots ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 50000;

-- 5. is_active 컬럼 추가 (없다면)
ALTER TABLE rental_time_slots ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 6. 기존 데이터에 오늘 날짜 설정
UPDATE rental_time_slots 
SET date = CURRENT_DATE 
WHERE date IS NULL;

-- 7. date 컬럼을 NOT NULL로 변경
ALTER TABLE rental_time_slots ALTER COLUMN date SET NOT NULL;

-- 8. 중복 제거를 위한 constraint 추가
ALTER TABLE rental_time_slots 
DROP CONSTRAINT IF EXISTS unique_device_date_time_slot;

ALTER TABLE rental_time_slots 
ADD CONSTRAINT unique_device_date_time_slot 
UNIQUE (device_type_id, date, start_time, end_time);

-- 9. slot_type을 'regular'로 기본값 설정
ALTER TABLE rental_time_slots 
ALTER COLUMN slot_type SET DEFAULT 'regular';

-- slot_type enum 확장
ALTER TABLE rental_time_slots 
DROP CONSTRAINT IF EXISTS rental_time_slots_slot_type_check;

ALTER TABLE rental_time_slots 
ADD CONSTRAINT rental_time_slots_slot_type_check 
CHECK (slot_type IN ('early', 'overnight', 'regular'));

-- 10. 기존 데이터 업데이트
UPDATE rental_time_slots
SET 
  available_units = COALESCE(available_units, ARRAY[1,2,3,4]),
  max_units = COALESCE(max_units, 4),
  price = COALESCE(price, (credit_options->0->>'price')::INTEGER, 50000),
  is_active = COALESCE(is_active, true),
  slot_type = COALESCE(slot_type, 'regular')
WHERE available_units IS NULL OR max_units IS NULL OR price IS NULL;