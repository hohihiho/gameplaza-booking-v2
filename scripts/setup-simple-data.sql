-- 광주 게임플라자 최소 초기 데이터 설정
-- 2025년 1월 10일

-- 1. 기본 설정은 이미 완료됨

-- 2. 카테고리와 기기 타입 생성 (간단 버전)
DO $$
DECLARE
  console_id UUID;
  simulator_id UUID;
BEGIN
  -- 콘솔 게임 카테고리
  INSERT INTO device_categories (name, display_order) 
  VALUES ('콘솔 게임', 1)
  RETURNING id INTO console_id;
  
  -- 시뮬레이터 카테고리
  INSERT INTO device_categories (name, display_order) 
  VALUES ('시뮬레이터', 2)
  RETURNING id INTO simulator_id;

  -- 기기 타입 생성 (중복 방지 없이)
  INSERT INTO device_types (name, category_id, description) VALUES
  ('PS5', console_id, 'PlayStation 5'),
  ('스위치', console_id, 'Nintendo Switch'),
  ('VR', console_id, 'Meta Quest 3'),
  ('레이싱', simulator_id, 'Racing Simulator');
  
  RAISE NOTICE '✅ 카테고리와 기기 타입 생성 완료';
END $$;

-- 3. 기기 등록
DO $$
DECLARE
  ps5_id UUID;
  switch_id UUID;
  vr_id UUID;
  racing_id UUID;
BEGIN
  -- 각 타입의 ID 가져오기
  SELECT id INTO ps5_id FROM device_types WHERE name = 'PS5' LIMIT 1;
  SELECT id INTO switch_id FROM device_types WHERE name = '스위치' LIMIT 1;
  SELECT id INTO vr_id FROM device_types WHERE name = 'VR' LIMIT 1;
  SELECT id INTO racing_id FROM device_types WHERE name = '레이싱' LIMIT 1;
  
  -- PS5 12대
  IF ps5_id IS NOT NULL THEN
    FOR i IN 1..12 LOOP
      INSERT INTO devices (device_type_id, device_number, status)
      VALUES (ps5_id, i, 'available');
    END LOOP;
    RAISE NOTICE '✅ PS5 12대 등록 완료';
  END IF;
  
  -- 스위치 7대
  IF switch_id IS NOT NULL THEN
    FOR i IN 1..7 LOOP
      INSERT INTO devices (device_type_id, device_number, status)
      VALUES (switch_id, i, 'available');
    END LOOP;
    RAISE NOTICE '✅ 스위치 7대 등록 완료';
  END IF;
  
  -- VR 6대
  IF vr_id IS NOT NULL THEN
    FOR i IN 1..6 LOOP
      INSERT INTO devices (device_type_id, device_number, status)
      VALUES (vr_id, i, 'available');
    END LOOP;
    RAISE NOTICE '✅ VR 6대 등록 완료';
  END IF;
  
  -- 레이싱 9대
  IF racing_id IS NOT NULL THEN
    FOR i IN 1..9 LOOP
      INSERT INTO devices (device_type_id, device_number, status)
      VALUES (racing_id, i, 'available');
    END LOOP;
    RAISE NOTICE '✅ 레이싱 시뮬레이터 9대 등록 완료';
  END IF;
END $$;

-- 4. 시간 슬롯 (10:00 ~ 22:00)
INSERT INTO time_slots (start_time, end_time)
SELECT 
  (hour || ':00')::time as start_time,
  ((hour + 1) || ':00')::time as end_time
FROM generate_series(10, 21) as hour
ON CONFLICT (start_time, end_time) DO NOTHING;

-- 5. 2025년 주요 공휴일
INSERT INTO holidays (date, name) VALUES
('2025-01-01', '신정'),
('2025-01-28', '설날 연휴'),
('2025-01-29', '설날'),
('2025-01-30', '설날 연휴'),
('2025-03-01', '삼일절'),
('2025-05-05', '어린이날'),
('2025-06-06', '현충일'),
('2025-08-15', '광복절'),
('2025-10-06', '추석'),
('2025-10-03', '개천절'),
('2025-10-09', '한글날'),
('2025-12-25', '크리스마스')
ON CONFLICT (date) DO NOTHING;

-- 완료
DO $$
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE '✅ 광주 게임플라자 초기 설정 완료!';
  RAISE NOTICE '📊 총 34대 기기 등록 (PS5 12, 스위치 7, VR 6, 레이싱 9)';
  RAISE NOTICE '⏰ 운영시간: 10:00 ~ 22:00';
  RAISE NOTICE '📅 2025년 공휴일 등록 완료';
  RAISE NOTICE '==========================================';
END $$;