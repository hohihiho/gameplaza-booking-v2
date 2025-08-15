-- 광주 게임플라자 초기 데이터 설정 V2
-- UUID 기반 테이블 구조에 맞춰 수정
-- 2025년 1월 10일

-- 1. 운영 시간 설정
INSERT INTO settings (key, value, description) VALUES
('operation_hours', '{"weekday": {"open": "10:00", "close": "22:00"}, "weekend": {"open": "10:00", "close": "22:00"}}', '운영 시간'),
('max_reservation_days', '7', '최대 예약 가능 일수'),
('max_reservations_per_user', '2', '사용자당 최대 예약 수'),
('reservation_time_unit', '60', '예약 시간 단위 (분)'),
('max_reservation_duration', '240', '최대 예약 시간 (분)'),
('cancellation_deadline', '60', '예약 취소 마감 시간 (분)'),
('check_in_deadline', '10', '체크인 마감 시간 (분)'),
('allow_weekend_reservations', 'true', '주말 예약 허용 여부'),
('allow_holiday_reservations', 'true', '공휴일 예약 허용 여부')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. 기기 카테고리 설정
DO $$
DECLARE
  console_category_id UUID;
  simulator_category_id UUID;
  other_category_id UUID;
  ps5_type_id UUID;
  switch_type_id UUID;
  vr_type_id UUID;
  racing_type_id UUID;
BEGIN
  -- 카테고리 생성
  INSERT INTO device_categories (name, display_order) VALUES ('콘솔 게임', 1)
  ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order
  RETURNING id INTO console_category_id;
  
  INSERT INTO device_categories (name, display_order) VALUES ('시뮬레이터', 2)
  ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order
  RETURNING id INTO simulator_category_id;
  
  INSERT INTO device_categories (name, display_order) VALUES ('기타', 3)
  ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order
  RETURNING id INTO other_category_id;

  -- 기기 타입 생성
  -- PS5
  INSERT INTO device_types (name, category_id, description, is_rentable) 
  VALUES ('PS5', console_category_id, 'PlayStation 5 Standard', false)
  ON CONFLICT (name) DO UPDATE SET category_id = console_category_id
  RETURNING id INTO ps5_type_id;
  
  -- 스위치
  INSERT INTO device_types (name, category_id, description, is_rentable) 
  VALUES ('스위치', console_category_id, 'Nintendo Switch OLED', false)
  ON CONFLICT (name) DO UPDATE SET category_id = console_category_id
  RETURNING id INTO switch_type_id;
  
  -- VR
  INSERT INTO device_types (name, category_id, description, is_rentable) 
  VALUES ('VR', console_category_id, 'Meta Quest 3', false)
  ON CONFLICT (name) DO UPDATE SET category_id = console_category_id
  RETURNING id INTO vr_type_id;
  
  -- 레이싱 시뮬레이터
  INSERT INTO device_types (name, category_id, description, is_rentable) 
  VALUES ('레이싱', simulator_category_id, 'Racing Simulator Pro', false)
  ON CONFLICT (name) DO UPDATE SET category_id = simulator_category_id
  RETURNING id INTO racing_type_id;

  -- 기기 등록
  -- PS5 12대
  FOR i IN 1..12 LOOP
    INSERT INTO devices (device_type_id, device_number, status)
    VALUES (ps5_type_id, i, 'available')
    ON CONFLICT (device_type_id, device_number) DO NOTHING;
  END LOOP;

  -- 스위치 7대
  FOR i IN 1..7 LOOP
    INSERT INTO devices (device_type_id, device_number, status)
    VALUES (switch_type_id, i, 'available')
    ON CONFLICT (device_type_id, device_number) DO NOTHING;
  END LOOP;

  -- VR 6대
  FOR i IN 1..6 LOOP
    INSERT INTO devices (device_type_id, device_number, status)
    VALUES (vr_type_id, i, 'available')
    ON CONFLICT (device_type_id, device_number) DO NOTHING;
  END LOOP;

  -- 레이싱 시뮬레이터 9대
  FOR i IN 1..9 LOOP
    INSERT INTO devices (device_type_id, device_number, status)
    VALUES (racing_type_id, i, 'available')
    ON CONFLICT (device_type_id, device_number) DO NOTHING;
  END LOOP;
  
  RAISE NOTICE '✅ 기기 등록 완료: PS5 12대, 스위치 7대, VR 6대, 레이싱 9대 (총 34대)';
END $$;

-- 3. 시간 슬롯 생성 (10:00 ~ 22:00, 1시간 단위)
INSERT INTO time_slots (start_time, end_time, is_active)
SELECT 
  (hour || ':00')::time as start_time,
  ((hour + 1) || ':00')::time as end_time,
  true as is_active
FROM generate_series(10, 21) as hour
ON CONFLICT (start_time, end_time) DO NOTHING;

-- 4. 공휴일 설정 (2025년)
INSERT INTO holidays (date, name, is_closed) VALUES
('2025-01-01', '신정', false),
('2025-01-28', '설날 연휴', false),
('2025-01-29', '설날', false),
('2025-01-30', '설날 연휴', false),
('2025-03-01', '삼일절', false),
('2025-05-05', '어린이날', false),
('2025-05-06', '어린이날 대체휴일', false),
('2025-06-06', '현충일', false),
('2025-08-15', '광복절', false),
('2025-10-05', '추석 연휴', false),
('2025-10-06', '추석', false),
('2025-10-07', '추석 연휴', false),
('2025-10-03', '개천절', false),
('2025-10-09', '한글날', false),
('2025-12-25', '크리스마스', false)
ON CONFLICT (date) DO NOTHING;

-- 5. 관리자 계정 업데이트 (Google 로그인 후 role 변경)
UPDATE users 
SET role = 'admin' 
WHERE email IN ('ndz5496@gmail.com', 'admin@gameplaza.kr');

-- 6. 기본 예약 규칙 설정
INSERT INTO reservation_rules (
  name, description, is_active, priority,
  min_duration_minutes, max_duration_minutes,
  advance_booking_days, cancellation_deadline_minutes
) VALUES
('기본 규칙', '표준 예약 규칙', true, 1, 60, 240, 7, 60)
ON CONFLICT (name) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  priority = EXCLUDED.priority,
  min_duration_minutes = EXCLUDED.min_duration_minutes,
  max_duration_minutes = EXCLUDED.max_duration_minutes,
  advance_booking_days = EXCLUDED.advance_booking_days,
  cancellation_deadline_minutes = EXCLUDED.cancellation_deadline_minutes;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 초기 데이터 설정 완료!';
  RAISE NOTICE '⏰ 운영시간: 10:00 ~ 22:00';
  RAISE NOTICE '📅 2025년 공휴일 등록 완료';
  RAISE NOTICE '👤 관리자 이메일을 admin 권한으로 업데이트하세요';
END $$;