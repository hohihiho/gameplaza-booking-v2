-- device_types 테이블에 model_name과 version_name 추가
ALTER TABLE device_types 
ADD COLUMN IF NOT EXISTS model_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS version_name VARCHAR(100);

-- 기존 devices 테이블의 데이터를 device_types로 이동
-- 각 device_type별로 첫 번째 device의 model_name과 version_name을 가져옴
UPDATE device_types dt
SET 
  model_name = d.model_name,
  version_name = d.version_name
FROM (
  SELECT DISTINCT ON (device_type_id) 
    device_type_id,
    model_name,
    version_name
  FROM devices
  WHERE model_name IS NOT NULL OR version_name IS NOT NULL
  ORDER BY device_type_id, device_number
) d
WHERE dt.id = d.device_type_id;

-- devices 테이블에서 model_name과 version_name 컬럼 제거
ALTER TABLE devices 
DROP COLUMN IF EXISTS model_name,
DROP COLUMN IF EXISTS version_name;