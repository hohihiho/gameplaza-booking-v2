-- Cron Job 모니터링 및 디버깅
-- 비전공자 설명: 자동 완료 시스템이 잘 작동하는지 확인하는 도구들입니다
-- 실행일: 2025-01-15

-- 1. 수동으로 한 번 실행해보기 (테스트용)
SELECT process_scheduled_completions();

-- 2. Cron job 실행 이력 확인 (최근 10개)
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time,
  end_time - start_time as duration
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-reservation-completions')
ORDER BY start_time DESC
LIMIT 10;

-- 3. 현재 활성화된 모든 cron jobs 확인
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobextra
FROM cron.job
WHERE active = true;

-- 4. 다음 1시간 내에 완료될 예약 미리보기
SELECT 
  r.id,
  u.name as user_name,
  dt.name as device_type,
  r.assigned_device_number,
  r.date,
  r.start_time || '-' || r.end_time as time_slot,
  CASE 
    WHEN r.actual_end_time IS NOT NULL THEN r.actual_end_time
    WHEN r.end_time < '06:00'::TIME THEN (r.date + INTERVAL '1 day')::DATE + r.end_time
    ELSE r.date::DATE + r.end_time
  END as scheduled_end_time,
  CASE 
    WHEN r.actual_end_time IS NOT NULL THEN r.actual_end_time
    WHEN r.end_time < '06:00'::TIME THEN (r.date + INTERVAL '1 day')::DATE + r.end_time
    ELSE r.date::DATE + r.end_time
  END - NOW() as time_remaining
FROM reservations r
JOIN users u ON u.id = r.user_id
LEFT JOIN devices d ON d.id = r.device_id
LEFT JOIN device_types dt ON dt.id = d.device_type_id
WHERE r.status = 'checked_in'
AND CASE 
    WHEN r.actual_end_time IS NOT NULL THEN r.actual_end_time
    WHEN r.end_time < '06:00'::TIME THEN (r.date + INTERVAL '1 day')::DATE + r.end_time
    ELSE r.date::DATE + r.end_time
  END BETWEEN NOW() AND NOW() + INTERVAL '1 hour'
ORDER BY scheduled_end_time;

-- 5. 오늘의 예약 상태 요약
SELECT 
  status,
  COUNT(*) as count
FROM reservations
WHERE date = CURRENT_DATE
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'pending' THEN 1
    WHEN 'approved' THEN 2
    WHEN 'checked_in' THEN 3
    WHEN 'completed' THEN 4
    WHEN 'cancelled' THEN 5
    WHEN 'rejected' THEN 6
    WHEN 'no_show' THEN 7
    ELSE 8
  END;

-- 6. 기기별 현재 상태
SELECT 
  dt.name as device_type,
  d.device_number,
  d.status,
  r.user_name,
  r.end_time,
  CASE 
    WHEN r.end_time IS NOT NULL AND d.status = 'in_use' THEN 
      '종료 예정: ' || TO_CHAR(
        CASE 
          WHEN r.end_time < '06:00'::TIME THEN (CURRENT_DATE + INTERVAL '1 day')::DATE + r.end_time
          ELSE CURRENT_DATE + r.end_time
        END, 'HH24:MI'
      )
    ELSE ''
  END as end_time_info
FROM devices d
JOIN device_types dt ON dt.id = d.device_type_id
LEFT JOIN LATERAL (
  SELECT 
    u.name as user_name,
    res.end_time,
    res.actual_end_time
  FROM reservations res
  JOIN users u ON u.id = res.user_id
  WHERE res.device_id = d.id
  AND res.status = 'checked_in'
  AND res.date = CURRENT_DATE
  LIMIT 1
) r ON true
WHERE d.is_active = true
ORDER BY dt.display_order, d.device_number;