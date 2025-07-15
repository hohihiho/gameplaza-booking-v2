-- 18일 조기영업 일정 추가
INSERT INTO schedule_events (
  date,
  title,
  type,
  start_time,
  end_time,
  is_auto_generated,
  source_type,
  source_reference,
  affects_reservation,
  description
) VALUES (
  '2025-07-18',
  '조기영업 (자동)',
  'early_open',
  '08:00',
  '12:00',
  true,
  'reservation_auto',
  'fff8a445-4858-4a86-ac46-f112ab068d9c',
  false,
  '예약 승인에 따라 자동으로 생성된 영업 일정입니다.'
) ON CONFLICT DO NOTHING;

-- 18일 밤샘영업 일정 추가
INSERT INTO schedule_events (
  date,
  title,
  type,
  start_time,
  end_time,
  is_auto_generated,
  source_type,
  source_reference,
  affects_reservation,
  description
) VALUES (
  '2025-07-18',
  '밤샘영업 (자동)',
  'overnight',
  '22:00',
  '05:00',
  true,
  'reservation_auto',
  'ee345666-62c6-4597-bddb-ebbfaae3e1f7',
  false,
  '예약 승인에 따라 자동으로 생성된 영업 일정입니다.'
) ON CONFLICT DO NOTHING;