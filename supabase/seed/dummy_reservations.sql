-- 테스트용 더미 예약 데이터
-- 다양한 기간의 예약 데이터를 생성하여 통계를 확인할 수 있도록 함

-- 먼저 기본 사용자 생성 (없으면)
INSERT INTO users (id, email, name, role)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'test1@example.com', '테스트 사용자 1', 'user'),
  ('22222222-2222-2222-2222-222222222222', 'test2@example.com', '테스트 사용자 2', 'user')
ON CONFLICT (id) DO NOTHING;

-- 기기 타입이 없으면 생성
INSERT INTO device_types (name, is_rentable)
VALUES 
  ('마이마이 DX', true),
  ('춘리즘', true),
  ('사운드 볼텍스', true),
  ('beatmania IIDX', true)
ON CONFLICT DO NOTHING;

-- 기기 생성 (없으면)
DO $$
DECLARE
  maimai_id UUID;
  chunithm_id UUID;
  sdvx_id UUID;
  iidx_id UUID;
BEGIN
  SELECT id INTO maimai_id FROM device_types WHERE name = '마이마이 DX';
  SELECT id INTO chunithm_id FROM device_types WHERE name = '춘리즘';
  SELECT id INTO sdvx_id FROM device_types WHERE name = '사운드 볼텍스';
  SELECT id INTO iidx_id FROM device_types WHERE name = 'beatmania IIDX';

  -- 각 기종별로 기기 생성
  INSERT INTO devices (device_type_id, device_number, status)
  VALUES 
    (maimai_id, 1, 'available'),
    (maimai_id, 2, 'available'),
    (chunithm_id, 1, 'available'),
    (chunithm_id, 2, 'available'),
    (sdvx_id, 1, 'available'),
    (iidx_id, 1, 'available')
  ON CONFLICT DO NOTHING;
END $$;

-- 다양한 날짜의 예약 데이터 생성
DO $$
DECLARE
  user1_id UUID := '11111111-1111-1111-1111-111111111111';
  user2_id UUID := '22222222-2222-2222-2222-222222222222';
  maimai_device1 UUID;
  maimai_device2 UUID;
  chunithm_device1 UUID;
  sdvx_device1 UUID;
  iidx_device1 UUID;
  current_date DATE;
  i INTEGER;
BEGIN
  -- 기기 ID 가져오기
  SELECT d.id INTO maimai_device1 FROM devices d 
    JOIN device_types dt ON d.device_type_id = dt.id 
    WHERE dt.name = '마이마이 DX' AND d.device_number = 1;
  
  SELECT d.id INTO maimai_device2 FROM devices d 
    JOIN device_types dt ON d.device_type_id = dt.id 
    WHERE dt.name = '마이마이 DX' AND d.device_number = 2;
    
  SELECT d.id INTO chunithm_device1 FROM devices d 
    JOIN device_types dt ON d.device_type_id = dt.id 
    WHERE dt.name = '춘리즘' AND d.device_number = 1;
    
  SELECT d.id INTO sdvx_device1 FROM devices d 
    JOIN device_types dt ON d.device_type_id = dt.id 
    WHERE dt.name = '사운드 볼텍스' AND d.device_number = 1;
    
  SELECT d.id INTO iidx_device1 FROM devices d 
    JOIN device_types dt ON d.device_type_id = dt.id 
    WHERE dt.name = 'beatmania IIDX' AND d.device_number = 1;

  -- 지난 3개월간의 예약 데이터 생성
  FOR i IN 0..90 LOOP
    current_date := CURRENT_DATE - (i || ' days')::INTERVAL;
    
    -- 마이마이 예약 (매일 2-3건)
    IF RANDOM() > 0.3 THEN
      INSERT INTO reservations (
        user_id, device_id, date, start_time, end_time,
        hourly_rate, status, reservation_number
      ) VALUES (
        CASE WHEN RANDOM() > 0.5 THEN user1_id ELSE user2_id END,
        maimai_device1,
        current_date,
        '09:00',
        '11:00',
        30000,
        'completed',
        'RES-' || TO_CHAR(current_date, 'YYMMDD') || '-001'
      );
    END IF;
    
    IF RANDOM() > 0.4 THEN
      INSERT INTO reservations (
        user_id, device_id, date, start_time, end_time,
        hourly_rate, status, reservation_number
      ) VALUES (
        CASE WHEN RANDOM() > 0.5 THEN user1_id ELSE user2_id END,
        maimai_device2,
        current_date,
        '14:00',
        '16:00',
        30000,
        'completed',
        'RES-' || TO_CHAR(current_date, 'YYMMDD') || '-002'
      );
    END IF;
    
    -- 춘리즘 예약 (매일 1-2건)
    IF RANDOM() > 0.5 THEN
      INSERT INTO reservations (
        user_id, device_id, date, start_time, end_time,
        hourly_rate, status, reservation_number
      ) VALUES (
        CASE WHEN RANDOM() > 0.5 THEN user1_id ELSE user2_id END,
        chunithm_device1,
        current_date,
        '10:00',
        '12:00',
        30000,
        'completed',
        'RES-' || TO_CHAR(current_date, 'YYMMDD') || '-003'
      );
    END IF;
    
    -- 사운드 볼텍스 예약 (가끔)
    IF RANDOM() > 0.7 THEN
      INSERT INTO reservations (
        user_id, device_id, date, start_time, end_time,
        hourly_rate, status, reservation_number
      ) VALUES (
        CASE WHEN RANDOM() > 0.5 THEN user1_id ELSE user2_id END,
        sdvx_device1,
        current_date,
        '08:00',
        '10:00',
        30000,
        'completed',
        'RES-' || TO_CHAR(current_date, 'YYMMDD') || '-004'
      );
    END IF;
    
    -- 밤샘 예약 (주말만)
    IF EXTRACT(DOW FROM current_date) IN (5, 6) AND RANDOM() > 0.6 THEN
      INSERT INTO reservations (
        user_id, device_id, date, start_time, end_time,
        hourly_rate, status, reservation_number
      ) VALUES (
        CASE WHEN RANDOM() > 0.5 THEN user1_id ELSE user2_id END,
        CASE 
          WHEN RANDOM() > 0.7 THEN maimai_device1
          WHEN RANDOM() > 0.5 THEN chunithm_device1
          ELSE iidx_device1
        END,
        current_date,
        '00:00',
        '04:00',
        25000,
        'completed',
        'RES-' || TO_CHAR(current_date, 'YYMMDD') || '-005'
      );
    END IF;
  END LOOP;
  
  -- 오늘과 내일 예약 (pending/approved)
  INSERT INTO reservations (
    user_id, device_id, date, start_time, end_time,
    hourly_rate, status, reservation_number
  ) VALUES 
    (user1_id, maimai_device1, CURRENT_DATE, '15:00', '17:00', 30000, 'approved', 'RES-' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || '-010'),
    (user2_id, chunithm_device1, CURRENT_DATE + 1, '10:00', '12:00', 30000, 'pending', 'RES-' || TO_CHAR(CURRENT_DATE + 1, 'YYMMDD') || '-011');
    
END $$;