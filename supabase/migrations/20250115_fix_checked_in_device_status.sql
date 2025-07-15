-- 현재 체크인된 예약의 기기 상태를 in_use로 업데이트
-- 비전공자 설명: 이미 체크인된 예약의 기기들을 '대여중' 상태로 변경합니다

-- 체크인된 예약의 device_id를 사용하여 기기 상태 업데이트
UPDATE devices d
SET status = 'in_use'
FROM reservations r
WHERE d.id = r.device_id
AND r.status = 'checked_in'
AND d.status = 'available';

-- 체크인된 예약 중 device_id가 없지만 assigned_device_number가 있는 경우 처리
UPDATE devices d
SET status = 'in_use'
FROM reservations r
WHERE d.device_number = r.assigned_device_number
AND r.status = 'checked_in'
AND r.device_id IS NULL
AND r.assigned_device_number IS NOT NULL
AND d.status = 'available'
AND EXISTS (
  -- 동일한 device_number를 가진 device 중 가장 적절한 것 선택
  SELECT 1 
  FROM devices d2
  WHERE d2.device_number = r.assigned_device_number
  AND d2.id = d.id
  LIMIT 1
);

-- 업데이트 결과 확인을 위한 로그
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- 업데이트된 기기 수 확인
  SELECT COUNT(*) INTO updated_count
  FROM devices
  WHERE status = 'in_use';
  
  RAISE NOTICE '대여중으로 변경된 기기 수: %', updated_count;
END $$;