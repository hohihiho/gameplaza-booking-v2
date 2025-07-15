-- schedule_events 테이블에 자동 생성 관련 필드 추가
ALTER TABLE schedule_events
ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) CHECK (source_type IN ('manual', 'reservation_auto')) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS source_reference UUID;

-- 자동 생성된 일정의 소스 참조를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_schedule_events_source_reference ON schedule_events(source_reference);

-- 자동 생성 일정 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_schedule_events_auto_generated ON schedule_events(is_auto_generated, date);

-- 기존 데이터는 모두 수동 생성으로 설정
UPDATE schedule_events 
SET is_auto_generated = FALSE, 
    source_type = 'manual' 
WHERE is_auto_generated IS NULL;

-- 코멘트 추가
COMMENT ON COLUMN schedule_events.is_auto_generated IS '자동 생성된 일정 여부';
COMMENT ON COLUMN schedule_events.source_type IS '일정 생성 방식 (manual: 수동, reservation_auto: 예약 기반 자동)';
COMMENT ON COLUMN schedule_events.source_reference IS '자동 생성된 경우 참조 ID (예: 예약 ID)';