-- 실시간 예약 완료 트리거 시스템
-- 비전공자 설명: 체크인이나 시간 조정 시 자동으로 완료 시간을 계산하고 처리하는 시스템
-- 실행일: 2025-01-15

-- 먼저 pg_cron 확장이 활성화되어 있는지 확인
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 0. 필요한 컬럼 추가 (없는 경우에만)
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 1. 예약 완료 스케줄 테이블
CREATE TABLE IF NOT EXISTS reservation_completion_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reservation_id)
);

-- 인덱스 추가
CREATE INDEX idx_completion_schedule_time ON reservation_completion_schedule(scheduled_at, processed);

-- 2. 스케줄 등록/업데이트 함수
CREATE OR REPLACE FUNCTION schedule_reservation_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_end_time TIMESTAMPTZ;
BEGIN
  -- 체크인 상태가 아니면 무시
  IF NEW.status != 'checked_in' THEN
    RETURN NEW;
  END IF;
  
  -- 종료 시간 계산
  IF NEW.actual_end_time IS NOT NULL THEN
    v_end_time := NEW.actual_end_time;
  ELSE
    -- end_time 사용
    v_end_time := NEW.date::DATE + NEW.end_time;
    -- 익일 새벽 시간 처리
    IF NEW.end_time < '06:00'::TIME THEN
      v_end_time := v_end_time + INTERVAL '1 day';
    END IF;
  END IF;
  
  -- 스케줄 등록 또는 업데이트
  INSERT INTO reservation_completion_schedule (reservation_id, scheduled_at)
  VALUES (NEW.id, v_end_time)
  ON CONFLICT (reservation_id) 
  DO UPDATE SET 
    scheduled_at = EXCLUDED.scheduled_at,
    processed = FALSE;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 트리거 생성
DROP TRIGGER IF EXISTS schedule_completion_on_checkin ON reservations;
CREATE TRIGGER schedule_completion_on_checkin
AFTER INSERT OR UPDATE OF status, actual_end_time ON reservations
FOR EACH ROW
EXECUTE FUNCTION schedule_reservation_completion();

-- 4. 배치 처리 함수 (1분마다 실행)
CREATE OR REPLACE FUNCTION process_scheduled_completions()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  rec RECORD;
BEGIN
  -- 처리할 예약들 조회
  FOR rec IN 
    SELECT 
      s.id as schedule_id,
      r.id as reservation_id,
      r.device_id,
      r.assigned_device_number,
      (SELECT device_type_id FROM devices WHERE id = r.device_id) as device_type_id
    FROM reservation_completion_schedule s
    JOIN reservations r ON r.id = s.reservation_id
    WHERE s.scheduled_at <= NOW()
    AND s.processed = FALSE
    AND r.status = 'checked_in'
    FOR UPDATE OF s, r SKIP LOCKED  -- 동시성 처리
  LOOP
    -- 예약 완료 처리
    UPDATE reservations
    SET status = 'completed',
        completed_at = NOW()
    WHERE id = rec.reservation_id;
    
    -- 기기 해제
    IF rec.device_id IS NOT NULL THEN
      UPDATE devices 
      SET status = 'available'
      WHERE id = rec.device_id;
    ELSIF rec.assigned_device_number IS NOT NULL AND rec.device_type_id IS NOT NULL THEN
      UPDATE devices 
      SET status = 'available'
      WHERE device_number = rec.assigned_device_number
      AND device_type_id = rec.device_type_id;
    END IF;
    
    -- 스케줄 처리 완료 표시
    UPDATE reservation_completion_schedule
    SET processed = TRUE
    WHERE id = rec.schedule_id;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 5. 1분마다 실행되는 pg_cron job
SELECT cron.schedule(
  'process-reservation-completions',
  '* * * * *',  -- 매분 실행
  'SELECT process_scheduled_completions();'
);

-- 6. 상태 확인 뷰
CREATE OR REPLACE VIEW v_completion_schedule AS
SELECT 
  r.id,
  u.name as user_name,
  COALESCE(dt.name, 'Unknown') as device_type,
  r.assigned_device_number,
  s.scheduled_at,
  s.scheduled_at - NOW() as time_remaining,
  s.processed
FROM reservation_completion_schedule s
JOIN reservations r ON r.id = s.reservation_id
JOIN users u ON u.id = r.user_id
LEFT JOIN devices d ON d.id = r.device_id
LEFT JOIN device_types dt ON dt.id = d.device_type_id
WHERE s.processed = FALSE
ORDER BY s.scheduled_at;

-- 7. 기존 체크인된 예약들에 대한 스케줄 등록 (초기 데이터)
INSERT INTO reservation_completion_schedule (reservation_id, scheduled_at)
SELECT 
  r.id,
  CASE 
    WHEN r.actual_end_time IS NOT NULL THEN r.actual_end_time
    WHEN r.end_time < '06:00'::TIME 
    THEN (r.date + INTERVAL '1 day')::DATE + r.end_time
    ELSE r.date::DATE + r.end_time
  END as scheduled_end
FROM reservations r
WHERE r.status = 'checked_in'
AND NOT EXISTS (
  SELECT 1 FROM reservation_completion_schedule s 
  WHERE s.reservation_id = r.id
);

-- 8. 디버깅용 함수 (필요시 사용)
CREATE OR REPLACE FUNCTION debug_completion_schedule()
RETURNS TABLE (
  reservation_id UUID,
  user_name TEXT,
  device_info TEXT,
  current_status TEXT,
  scheduled_time TIMESTAMPTZ,
  minutes_until_completion NUMERIC,
  will_process_at TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    u.name::TEXT,
    (COALESCE(dt.name, 'Unknown') || ' #' || COALESCE(r.assigned_device_number::TEXT, 'N/A'))::TEXT,
    r.status::TEXT,
    s.scheduled_at,
    ROUND(EXTRACT(EPOCH FROM (s.scheduled_at - NOW())) / 60, 1),
    CASE 
      WHEN s.scheduled_at <= NOW() THEN '다음 실행 시 처리됨'
      ELSE TO_CHAR(s.scheduled_at, 'HH24:MI')
    END::TEXT
  FROM reservation_completion_schedule s
  JOIN reservations r ON r.id = s.reservation_id
  JOIN users u ON u.id = r.user_id
  LEFT JOIN devices d ON d.id = r.device_id
  LEFT JOIN device_types dt ON dt.id = d.device_type_id
  WHERE s.processed = FALSE
  AND r.status = 'checked_in'
  ORDER BY s.scheduled_at;
END;
$$ LANGUAGE plpgsql;

-- 사용법: SELECT * FROM debug_completion_schedule();