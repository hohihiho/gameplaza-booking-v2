-- devices 테이블에 모델명과 버전명 필드 추가
ALTER TABLE devices 
ADD COLUMN model_name VARCHAR(100),
ADD COLUMN version_name VARCHAR(100);

-- 기존 데이터 업데이트 예시 (필요시 주석 해제)
-- UPDATE devices SET model_name = 'VALKYRIE model' WHERE device_type_id = (SELECT id FROM device_types WHERE name = '사운드 볼텍스');
-- UPDATE devices SET model_name = 'LIGHTNING model' WHERE device_type_id = (SELECT id FROM device_types WHERE name = 'BEATMANIA IIDX');

-- 컬럼 설명 추가
COMMENT ON COLUMN devices.model_name IS '기체 모델명 (예: VALKYRIE model, LIGHTNING model)';
COMMENT ON COLUMN devices.version_name IS '게임 버전명 (예: EXCEED GEAR, BISTROVER)';