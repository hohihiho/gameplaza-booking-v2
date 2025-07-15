-- actual_end_time을 고려한 자동 종료 함수 업데이트
-- 비전공자 설명: 시간 조정된 경우 조정된 종료 시간을 기준으로 자동 종료되도록 수정합니다

-- 기존 함수 대체
CREATE OR REPLACE FUNCTION check_and_update_expired_rentals()
RETURNS void AS $$
DECLARE
  rec RECORD;
  current_time_kst TIMESTAMP;
  expected_end_time TIMESTAMP;
BEGIN
  -- 현재 KST 시간 계산
  current_time_kst := NOW() AT TIME ZONE 'Asia/Seoul';
  
  -- 종료 시간이 지난 checked_in 상태의 예약들 찾기
  FOR rec IN 
    SELECT r.id as reservation_id, 
           r.assigned_device_number,
           r.device_id,
           r.date,
           r.end_time,
           r.actual_end_time
    FROM reservations r
    WHERE r.status = 'checked_in'
  LOOP
    -- 실제 종료 시간이 설정된 경우 그것을 사용, 아니면 예약된 종료 시간 사용
    IF rec.actual_end_time IS NOT NULL THEN
      expected_end_time := rec.actual_end_time;
    ELSE
      expected_end_time := (rec.date + rec.end_time::time)::timestamp;
    END IF;
    
    -- 종료 시간이 지났으면 처리
    IF expected_end_time < current_time_kst THEN
      -- 예약을 completed로 변경
      UPDATE reservations
      SET status = 'completed',
          actual_end_time = COALESCE(actual_end_time, current_time_kst)
      WHERE id = rec.reservation_id;
      
      -- 기기를 available로 변경
      IF rec.device_id IS NOT NULL THEN
        UPDATE devices 
        SET status = 'available'
        WHERE id = rec.device_id;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 로그 추가
COMMENT ON FUNCTION check_and_update_expired_rentals() IS '체크인된 예약의 종료 시간을 확인하여 자동으로 완료 처리. actual_end_time이 설정된 경우 해당 시간 기준으로 처리';