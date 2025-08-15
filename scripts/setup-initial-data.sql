-- 광주 게임플라자 초기 데이터 설정
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

-- 2. 기기 카테고리 설정 (이미 있을 수 있으므로 ON CONFLICT 사용)
INSERT INTO device_categories (id, name, display_order) VALUES
(1, '콘솔 게임', 1),
(2, '시뮬레이터', 2),
(3, '기타', 3)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order;

-- 3. 기기 타입 설정 (실제 운영 데이터)
INSERT INTO device_types (
  id, name, model_name, version_name, category_id, 
  is_rental, max_rental_units, display_order
) VALUES
-- PS5 (12대)
(1, 'PS5', 'PlayStation 5', 'Standard', 1, false, 1, 1),
-- 스위치 (7대)
(2, '스위치', 'Nintendo Switch', 'OLED', 1, false, 1, 2),
-- VR (6대)
(3, 'VR', 'Meta Quest', '3', 1, false, 1, 3),
-- 레이싱 시뮬레이터 (9대)
(4, '레이싱', 'Racing Simulator', 'Pro', 2, false, 1, 4)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  model_name = EXCLUDED.model_name,
  version_name = EXCLUDED.version_name,
  category_id = EXCLUDED.category_id,
  is_rental = EXCLUDED.is_rental,
  max_rental_units = EXCLUDED.max_rental_units,
  display_order = EXCLUDED.display_order;

-- 4. 기기 등록 (총 34대)
DO $$
DECLARE
  type_id INTEGER;
  device_count INTEGER;
  i INTEGER;
BEGIN
  -- PS5 12대
  type_id := 1;
  device_count := 12;
  FOR i IN 1..device_count LOOP
    INSERT INTO devices (device_type_id, device_number, status)
    VALUES (type_id, i, 'available')
    ON CONFLICT (device_type_id, device_number) DO NOTHING;
  END LOOP;

  -- 스위치 7대
  type_id := 2;
  device_count := 7;
  FOR i IN 1..device_count LOOP
    INSERT INTO devices (device_type_id, device_number, status)
    VALUES (type_id, i, 'available')
    ON CONFLICT (device_type_id, device_number) DO NOTHING;
  END LOOP;

  -- VR 6대
  type_id := 3;
  device_count := 6;
  FOR i IN 1..device_count LOOP
    INSERT INTO devices (device_type_id, device_number, status)
    VALUES (type_id, i, 'available')
    ON CONFLICT (device_type_id, device_number) DO NOTHING;
  END LOOP;

  -- 레이싱 시뮬레이터 9대
  type_id := 4;
  device_count := 9;
  FOR i IN 1..device_count LOOP
    INSERT INTO devices (device_type_id, device_number, status)
    VALUES (type_id, i, 'available')
    ON CONFLICT (device_type_id, device_number) DO NOTHING;
  END LOOP;
END $$;

-- 5. 시간 슬롯 생성 (10:00 ~ 22:00, 1시간 단위)
INSERT INTO time_slots (start_time, end_time, duration_minutes, is_active)
SELECT 
  (hour || ':00')::time as start_time,
  ((hour + 1) || ':00')::time as end_time,
  60 as duration_minutes,
  true as is_active
FROM generate_series(10, 21) as hour
ON CONFLICT (start_time, end_time) DO NOTHING;

-- 6. 예약 규칙 설정
INSERT INTO reservation_rules (
  rule_type, is_active, priority,
  min_duration_minutes, max_duration_minutes,
  advance_booking_days, cancellation_deadline_minutes
) VALUES
('standard', true, 1, 60, 240, 7, 60)
ON CONFLICT (rule_type) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  priority = EXCLUDED.priority,
  min_duration_minutes = EXCLUDED.min_duration_minutes,
  max_duration_minutes = EXCLUDED.max_duration_minutes,
  advance_booking_days = EXCLUDED.advance_booking_days,
  cancellation_deadline_minutes = EXCLUDED.cancellation_deadline_minutes;

-- 7. 기기별 규칙 설정
INSERT INTO machine_rules (
  device_type_id, max_daily_hours, max_consecutive_hours,
  cooldown_minutes, is_active
) VALUES
(1, 4, 2, 30, true), -- PS5
(2, 4, 2, 30, true), -- 스위치
(3, 2, 1, 30, true), -- VR (더 짧게)
(4, 2, 1, 30, true)  -- 레이싱
ON CONFLICT (device_type_id) DO UPDATE SET
  max_daily_hours = EXCLUDED.max_daily_hours,
  max_consecutive_hours = EXCLUDED.max_consecutive_hours,
  cooldown_minutes = EXCLUDED.cooldown_minutes,
  is_active = EXCLUDED.is_active;

-- 8. 공휴일 설정 (2025년)
INSERT INTO holidays (date, name, is_regular_holiday) VALUES
('2025-01-01', '신정', true),
('2025-01-28', '설날 연휴', true),
('2025-01-29', '설날', true),
('2025-01-30', '설날 연휴', true),
('2025-03-01', '삼일절', true),
('2025-05-05', '어린이날', true),
('2025-05-06', '어린이날 대체휴일', true),
('2025-06-06', '현충일', true),
('2025-08-15', '광복절', true),
('2025-10-05', '추석 연휴', true),
('2025-10-06', '추석', true),
('2025-10-07', '추석 연휴', true),
('2025-10-03', '개천절', true),
('2025-10-09', '한글날', true),
('2025-12-25', '크리스마스', true)
ON CONFLICT (date) DO NOTHING;

-- 9. 관리자 계정 (Google 로그인 후 role만 변경하면 됨)
-- Google OAuth로 로그인한 사용자 중 특정 이메일을 관리자로 지정
UPDATE users 
SET role = 'admin' 
WHERE email IN ('ndz5496@gmail.com', 'admin@gameplaza.kr')
AND EXISTS (SELECT 1 FROM users WHERE email IN ('ndz5496@gmail.com', 'admin@gameplaza.kr'));

-- 10. 가이드 콘텐츠
INSERT INTO guide_content (key, title, content) VALUES
('reservation_guide', '예약 가이드', '광주 게임플라자 예약 시스템 사용 방법입니다.'),
('device_guide', '기기 사용 가이드', '각 게임 기기의 사용 방법을 안내합니다.'),
('rules', '이용 규칙', '게임플라자 이용 시 지켜야 할 규칙입니다.')
ON CONFLICT (key) DO NOTHING;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 초기 데이터 설정 완료!';
  RAISE NOTICE '📊 설정된 기기: PS5 12대, 스위치 7대, VR 6대, 레이싱 9대 (총 34대)';
  RAISE NOTICE '⏰ 운영시간: 10:00 ~ 22:00';
  RAISE NOTICE '📅 공휴일: 2025년 공휴일 등록 완료';
END $$;