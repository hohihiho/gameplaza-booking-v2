-- 대여 시스템 스키마 수정 및 데이터 추가
-- 이 스크립트는 현재 꼬인 DB 구조를 정리하고 애플리케이션이 기대하는 구조로 만듭니다

-- 1. device_types의 rental_settings JSONB 컬럼 업데이트
-- 애플리케이션이 기대하는 구조로 변경
UPDATE device_types 
SET rental_settings = jsonb_build_object(
  'credit_types', ARRAY['freeplay', 'unlimited']::text[],
  'base_price', 50000,
  'max_players', 1,
  'price_multiplier_2p', 1
)
WHERE is_rentable = true 
AND name IN ('CHUNITHM', '사운드 볼텍스', 'BEATMANIA IIDX');

-- 마이마이 DX는 2인 플레이 가능
UPDATE device_types 
SET rental_settings = jsonb_build_object(
  'credit_types', ARRAY['freeplay', 'unlimited']::text[],
  'base_price', 60000,
  'max_players', 2,
  'price_multiplier_2p', 1.5,
  'max_rental_units', 3
)
WHERE is_rentable = true 
AND name = '마이마이 DX';

-- 2. rental_time_slots 테이블에 date 컬럼 추가 (없다면)
-- 현재 구조는 slot_type 기반이지만, 애플리케이션은 date 기반으로 조회함
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rental_time_slots' 
    AND column_name = 'date'
  ) THEN
    ALTER TABLE rental_time_slots ADD COLUMN date DATE;
    -- 오늘 날짜로 기본값 설정
    UPDATE rental_time_slots SET date = CURRENT_DATE WHERE date IS NULL;
    ALTER TABLE rental_time_slots ALTER COLUMN date SET NOT NULL;
  END IF;
END $$;

-- 3. rental_time_slots 테이블에 필요한 컬럼 추가
DO $$ 
BEGIN
  -- available_units 컬럼 추가 (없다면)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rental_time_slots' 
    AND column_name = 'available_units'
  ) THEN
    ALTER TABLE rental_time_slots ADD COLUMN available_units INTEGER[] DEFAULT ARRAY[1,2,3,4];
  END IF;

  -- max_units 컬럼 추가 (없다면)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rental_time_slots' 
    AND column_name = 'max_units'
  ) THEN
    ALTER TABLE rental_time_slots ADD COLUMN max_units INTEGER DEFAULT 4;
  END IF;

  -- price 컬럼 추가 (없다면) - 기본 가격
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rental_time_slots' 
    AND column_name = 'price'
  ) THEN
    ALTER TABLE rental_time_slots ADD COLUMN price INTEGER DEFAULT 50000;
  END IF;

  -- is_active 컬럼 추가 (없다면)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rental_time_slots' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE rental_time_slots ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- 4. 기존 rental_time_slots 데이터 업데이트
UPDATE rental_time_slots
SET 
  available_units = ARRAY[1,2,3,4],
  max_units = 4,
  price = COALESCE(
    (credit_options->0->>'price')::INTEGER,
    50000
  ),
  is_active = true
WHERE available_units IS NULL;

-- 5. 오늘과 내일 날짜에 대한 시간대 추가 (테스트용)
-- 각 대여 가능한 기기에 대해 시간대 생성
DO $$
DECLARE
  device_record RECORD;
  target_date DATE;
BEGIN
  -- 오늘과 내일 날짜
  FOR target_date IN SELECT generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', INTERVAL '1 day')::DATE
  LOOP
    -- 각 대여 가능한 기기에 대해
    FOR device_record IN 
      SELECT id, name, rental_settings 
      FROM device_types 
      WHERE is_rentable = true
    LOOP
      -- 오전 시간대 (10:00-14:00)
      INSERT INTO rental_time_slots (
        device_type_id, date, start_time, end_time,
        slot_type, available_units, max_units, price,
        credit_options, is_active
      ) VALUES (
        device_record.id,
        target_date,
        '10:00:00'::TIME,
        '14:00:00'::TIME,
        'regular',
        ARRAY[1,2,3,4],
        4,
        (device_record.rental_settings->>'base_price')::INTEGER,
        jsonb_build_array(
          jsonb_build_object('type', 'freeplay', 'price', (device_record.rental_settings->>'base_price')::INTEGER),
          jsonb_build_object('type', 'unlimited', 'price', ((device_record.rental_settings->>'base_price')::INTEGER * 1.2)::INTEGER)
        ),
        true
      ) ON CONFLICT DO NOTHING;

      -- 오후 시간대 (14:00-18:00)
      INSERT INTO rental_time_slots (
        device_type_id, date, start_time, end_time,
        slot_type, available_units, max_units, price,
        credit_options, is_active
      ) VALUES (
        device_record.id,
        target_date,
        '14:00:00'::TIME,
        '18:00:00'::TIME,
        'regular',
        ARRAY[1,2,3,4],
        4,
        (device_record.rental_settings->>'base_price')::INTEGER,
        jsonb_build_array(
          jsonb_build_object('type', 'freeplay', 'price', (device_record.rental_settings->>'base_price')::INTEGER),
          jsonb_build_object('type', 'unlimited', 'price', ((device_record.rental_settings->>'base_price')::INTEGER * 1.2)::INTEGER)
        ),
        true
      ) ON CONFLICT DO NOTHING;

      -- 저녁 시간대 (18:00-22:00)
      INSERT INTO rental_time_slots (
        device_type_id, date, start_time, end_time,
        slot_type, available_units, max_units, price,
        credit_options, is_active
      ) VALUES (
        device_record.id,
        target_date,
        '18:00:00'::TIME,
        '22:00:00'::TIME,
        'regular',
        ARRAY[1,2,3,4],
        4,
        (device_record.rental_settings->>'base_price')::INTEGER,
        jsonb_build_array(
          jsonb_build_object('type', 'freeplay', 'price', (device_record.rental_settings->>'base_price')::INTEGER),
          jsonb_build_object('type', 'unlimited', 'price', ((device_record.rental_settings->>'base_price')::INTEGER * 1.2)::INTEGER)
        ),
        true
      ) ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- 6. 중복 제거를 위한 unique constraint 추가 (없다면)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_device_date_time_slot'
  ) THEN
    ALTER TABLE rental_time_slots 
    ADD CONSTRAINT unique_device_date_time_slot 
    UNIQUE (device_type_id, date, start_time, end_time);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 7. device_types 테이블에 company 컬럼 추가 (category 대신 사용)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'device_types' 
    AND column_name = 'company'
  ) THEN
    ALTER TABLE device_types ADD COLUMN company VARCHAR(100);
    
    -- category_id를 기반으로 company 이름 설정
    UPDATE device_types dt
    SET company = dc.name
    FROM device_categories dc
    WHERE dt.category_id = dc.id;
  END IF;
END $$;

-- 8. device_types 테이블에 추가 필요 컬럼들
DO $$ 
BEGIN
  -- image_url 컬럼
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'device_types' 
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE device_types ADD COLUMN image_url TEXT;
  END IF;

  -- max_players 컬럼 (rental_settings에서 가져오기)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'device_types' 
    AND column_name = 'max_players'
  ) THEN
    ALTER TABLE device_types ADD COLUMN max_players INTEGER DEFAULT 1;
    UPDATE device_types 
    SET max_players = COALESCE((rental_settings->>'max_players')::INTEGER, 1);
  END IF;

  -- base_price 컬럼
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'device_types' 
    AND column_name = 'base_price'
  ) THEN
    ALTER TABLE device_types ADD COLUMN base_price INTEGER DEFAULT 50000;
    UPDATE device_types 
    SET base_price = COALESCE((rental_settings->>'base_price')::INTEGER, 50000);
  END IF;

  -- is_active 컬럼
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'device_types' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE device_types ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- 결과 확인
SELECT 'device_types 업데이트 완료' as status, count(*) as count FROM device_types WHERE is_rentable = true;
SELECT 'rental_time_slots 생성 완료' as status, count(*) as count FROM rental_time_slots WHERE date >= CURRENT_DATE;