-- 이미 종료 시간이 지난 예약들 즉시 처리
-- 비전공자 설명: 시스템 설치 시 이미 시간이 지난 예약들을 한 번에 정리합니다
-- 실행일: 2025-01-15

-- 1. 현재 체크인 상태이면서 종료 시간이 지난 예약들 조회
DO $$
DECLARE
  rec RECORD;
  v_count INTEGER := 0;
BEGIN
  RAISE NOTICE '종료 시간이 지난 예약 처리 시작...';
  
  -- 종료 시간이 지난 체크인된 예약들 처리
  FOR rec IN 
    SELECT 
      r.id as reservation_id,
      r.device_id,
      r.assigned_device_number,
      d.device_type_id,
      r.user_id,
      CASE 
        WHEN r.actual_end_time IS NOT NULL THEN r.actual_end_time
        WHEN r.end_time < '06:00'::TIME THEN (r.date + INTERVAL '1 day')::DATE + r.end_time
        ELSE r.date::DATE + r.end_time
      END as scheduled_end_time
    FROM reservations r
    LEFT JOIN devices d ON d.id = r.device_id
    WHERE r.status = 'checked_in'
    AND (
      -- actual_end_time이 있으면 그 시간 기준
      (r.actual_end_time IS NOT NULL AND r.actual_end_time <= NOW()) OR
      -- 없으면 예약 종료 시간 기준
      (r.actual_end_time IS NULL AND 
       CASE 
         WHEN r.end_time < '06:00'::TIME THEN (r.date + INTERVAL '1 day')::DATE + r.end_time
         ELSE r.date::DATE + r.end_time
       END <= NOW()
      )
    )
  LOOP
    -- 예약을 완료 상태로 변경
    UPDATE reservations
    SET status = 'completed',
        completed_at = NOW()
    WHERE id = rec.reservation_id;
    
    -- 기기를 사용가능 상태로 변경
    IF rec.device_id IS NOT NULL THEN
      UPDATE devices 
      SET status = 'available'
      WHERE id = rec.device_id;
      
      RAISE NOTICE '예약 % 완료 처리, 기기 ID % 해제', rec.reservation_id, rec.device_id;
    ELSIF rec.assigned_device_number IS NOT NULL AND rec.device_type_id IS NOT NULL THEN
      UPDATE devices 
      SET status = 'available'
      WHERE device_number = rec.assigned_device_number
      AND device_type_id = rec.device_type_id;
      
      RAISE NOTICE '예약 % 완료 처리, 기기 번호 % 해제', rec.reservation_id, rec.assigned_device_number;
    ELSE
      RAISE NOTICE '예약 % 완료 처리 (기기 정보 없음)', rec.reservation_id;
    END IF;
    
    -- 스케줄에서도 처리 완료로 표시
    UPDATE reservation_completion_schedule
    SET processed = TRUE
    WHERE reservation_id = rec.reservation_id;
    
    v_count := v_count + 1;
  END LOOP;
  
  RAISE NOTICE '총 %개의 만료된 예약을 처리했습니다.', v_count;
END;
$$;

-- 2. 처리 결과 확인
SELECT 
  r.id,
  u.name as user_name,
  r.date,
  r.start_time || '-' || r.end_time as time_slot,
  r.status,
  r.completed_at,
  CASE 
    WHEN r.actual_end_time IS NOT NULL THEN r.actual_end_time
    WHEN r.end_time < '06:00'::TIME THEN (r.date + INTERVAL '1 day')::DATE + r.end_time
    ELSE r.date::DATE + r.end_time
  END as scheduled_end_time,
  d.device_number,
  d.status as device_status
FROM reservations r
JOIN users u ON u.id = r.user_id
LEFT JOIN devices d ON d.id = r.device_id
WHERE r.date >= CURRENT_DATE - INTERVAL '7 days'
AND r.status IN ('completed', 'checked_in')
ORDER BY r.date DESC, r.start_time DESC;

-- 3. 앞으로 처리될 예약 스케줄 확인
SELECT * FROM v_completion_schedule;

-- 4. cron job 실행 상태 확인
SELECT 
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job;