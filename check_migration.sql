
-- 생성된 테이블 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('device_categories', 'device_types', 'play_modes', 'rental_settings', 'devices', 'rental_time_slots')
ORDER BY table_name;

-- 카테고리 데이터 확인
SELECT * FROM device_categories ORDER BY display_order;

-- 대여 가능한 기기 타입 확인
SELECT dt.name as device_name, dc.name as category_name, dt.is_rentable
FROM device_types dt
JOIN device_categories dc ON dt.category_id = dc.id
WHERE dt.is_rentable = true
ORDER BY dc.display_order, dt.name;

-- 기기별 상태 확인
SELECT dt.name as device_type, d.device_number, d.status
FROM devices d
JOIN device_types dt ON d.device_type_id = dt.id
ORDER BY dt.name, d.device_number;
