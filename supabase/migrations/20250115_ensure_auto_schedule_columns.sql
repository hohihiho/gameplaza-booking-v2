-- schedule_events 테이블에 자동 생성 관련 필드가 없다면 추가
DO $$ 
BEGIN
    -- is_auto_generated 컬럼 확인 및 추가
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'schedule_events' 
        AND column_name = 'is_auto_generated'
    ) THEN
        ALTER TABLE schedule_events
        ADD COLUMN is_auto_generated BOOLEAN DEFAULT FALSE;
    END IF;

    -- source_type 컬럼 확인 및 추가
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'schedule_events' 
        AND column_name = 'source_type'
    ) THEN
        ALTER TABLE schedule_events
        ADD COLUMN source_type VARCHAR(50) CHECK (source_type IN ('manual', 'reservation_auto')) DEFAULT 'manual';
    END IF;

    -- source_reference 컬럼 확인 및 추가
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'schedule_events' 
        AND column_name = 'source_reference'
    ) THEN
        ALTER TABLE schedule_events
        ADD COLUMN source_reference UUID;
    END IF;
END $$;

-- 인덱스가 없다면 생성
CREATE INDEX IF NOT EXISTS idx_schedule_events_source_reference ON schedule_events(source_reference);
CREATE INDEX IF NOT EXISTS idx_schedule_events_auto_generated ON schedule_events(is_auto_generated, date);

-- 코멘트 추가
COMMENT ON COLUMN schedule_events.is_auto_generated IS '자동 생성된 일정 여부';
COMMENT ON COLUMN schedule_events.source_type IS '일정 생성 방식 (manual: 수동, reservation_auto: 예약 기반 자동)';
COMMENT ON COLUMN schedule_events.source_reference IS '자동 생성된 경우 참조 ID (예: 예약 ID)';

-- 기존 데이터 업데이트
UPDATE schedule_events 
SET is_auto_generated = FALSE, 
    source_type = 'manual' 
WHERE is_auto_generated IS NULL;