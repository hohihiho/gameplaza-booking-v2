-- 사운드 볼텍스 기기들에 모델명 추가
UPDATE devices 
SET model_name = 'VALKYRIE model'
WHERE device_type_id = (SELECT id FROM device_types WHERE name = '사운드 볼텍스')
AND device_number IN (1, 2);

UPDATE devices 
SET model_name = 'EXCEED GEAR model'
WHERE device_type_id = (SELECT id FROM device_types WHERE name = '사운드 볼텍스')
AND device_number = 3;

-- BEATMANIA IIDX 기기들에 모델명 추가
UPDATE devices 
SET model_name = 'LIGHTNING model'
WHERE device_type_id = (SELECT id FROM device_types WHERE name = 'BEATMANIA IIDX')
AND device_number IN (1, 2);

-- 춘리 THE WORLD 기기에 버전명 추가
UPDATE devices 
SET version_name = '29 CastHour'
WHERE device_type_id = (SELECT id FROM device_types WHERE name = 'BEATMANIA IIDX')
AND device_number = 1;

UPDATE devices 
SET version_name = '30 RESIDENT'
WHERE device_type_id = (SELECT id FROM device_types WHERE name = 'BEATMANIA IIDX')
AND device_number = 2;

-- 마이마이 DX 기기에 모델명 추가
UPDATE devices 
SET model_name = 'DX PLUS'
WHERE device_type_id = (SELECT id FROM device_types WHERE name = '마이마이 DX')
AND device_number <= 4;