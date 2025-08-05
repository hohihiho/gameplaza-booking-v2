-- 비트매니아 IIDX의 max_rental_units를 1로 설정
-- 1대뿐이므로 조기/밤샘 시간대에 각각 1개씩만 예약 가능

UPDATE rental_time_slots 
SET max_rental_units = 1
WHERE device_type_id = (
  SELECT id FROM device_types WHERE name = 'beatmania IIDX'
);

-- 확인을 위한 쿼리
SELECT 
  dt.name,
  rts.start_time,
  rts.end_time,
  rts.max_rental_units,
  rts.credit_options
FROM rental_time_slots rts
JOIN device_types dt ON rts.device_type_id = dt.id
WHERE dt.name = 'beatmania IIDX'
ORDER BY rts.start_time;