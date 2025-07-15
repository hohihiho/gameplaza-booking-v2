-- FOR UPDATE 오류 수정
-- 비전공자 설명: 동시성 처리 부분의 오류를 수정합니다
-- 실행일: 2025-01-15

-- 기존 함수 삭제 후 재생성
DROP FUNCTION IF EXISTS process_scheduled_completions();

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

-- 함수 테스트 실행
SELECT process_scheduled_completions();

-- 결과 확인
SELECT * FROM v_completion_schedule;