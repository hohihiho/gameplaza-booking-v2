-- v2 API를 위한 예약 테이블 마이그레이션
-- 이 스크립트는 안전하게 실행 가능하도록 설계되었습니다 (IF NOT EXISTS 사용)

-- 1. 누락된 컬럼 추가 (이미 존재하는 컬럼은 건너뜀)
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS reservation_number VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS date DATE,
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME,
ADD COLUMN IF NOT EXISTS device_id UUID REFERENCES devices(id),
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS user_notes TEXT,
ADD COLUMN IF NOT EXISTS credit_type VARCHAR(20) DEFAULT 'freeplay',
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';

-- 2. total_amount 타입 변경 (integer → decimal)
-- 기존 integer 타입을 decimal로 변경하여 소수점 지원
DO $$
BEGIN
    -- 컬럼 타입이 integer인 경우에만 변경
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'total_amount' 
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE reservations 
        ALTER COLUMN total_amount TYPE DECIMAL(10,2) 
        USING total_amount::decimal(10,2);
    END IF;
END $$;

-- 3. 예약 번호 생성 함수 (재사용 가능)
CREATE OR REPLACE FUNCTION generate_reservation_number(p_date DATE)
RETURNS VARCHAR(20) AS $$
DECLARE
    v_date_str VARCHAR(6);
    v_seq_num INTEGER;
    v_reservation_number VARCHAR(20);
BEGIN
    -- YYMMDD 형식으로 날짜 문자열 생성
    v_date_str := TO_CHAR(p_date, 'YYMMDD');
    
    -- 해당 날짜의 시퀀스 번호 계산
    SELECT COUNT(*) + 1 INTO v_seq_num
    FROM reservations
    WHERE date = p_date
      AND reservation_number LIKE v_date_str || '-%';
    
    -- 예약 번호 생성
    v_reservation_number := v_date_str || '-' || LPAD(v_seq_num::text, 3, '0');
    
    RETURN v_reservation_number;
END;
$$ LANGUAGE plpgsql;

-- 4. 예약 번호가 없는 레코드에 대해 예약 번호 생성
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT id, date, created_at 
        FROM reservations 
        WHERE reservation_number IS NULL 
        ORDER BY date, created_at
    LOOP
        UPDATE reservations
        SET reservation_number = generate_reservation_number(rec.date)
        WHERE id = rec.id;
    END LOOP;
END $$;

-- 5. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_device_date ON reservations(device_id, date);
CREATE INDEX IF NOT EXISTS idx_reservations_user_status ON reservations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_reservation_number ON reservations(reservation_number);

-- 6. RLS 정책 확인 및 추가
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can create own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update own pending reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can do everything" ON reservations;

-- 새로운 정책 생성
-- 사용자는 자신의 예약만 조회 가능
CREATE POLICY "Users can view own reservations" ON reservations
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 예약만 생성 가능
CREATE POLICY "Users can create own reservations" ON reservations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 pending 예약만 수정 가능
CREATE POLICY "Users can update own pending reservations" ON reservations
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND status = 'pending'
    );

-- 관리자는 모든 예약에 접근 가능
CREATE POLICY "Admins can do everything" ON reservations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- 7. 트리거 생성: 예약 생성 시 자동으로 예약 번호 생성
CREATE OR REPLACE FUNCTION set_reservation_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reservation_number IS NULL THEN
        NEW.reservation_number := generate_reservation_number(NEW.date);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_reservation_number_trigger ON reservations;
CREATE TRIGGER set_reservation_number_trigger
    BEFORE INSERT ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION set_reservation_number();

-- 8. 데이터 무결성 체크
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- NULL 값 체크
    SELECT COUNT(*) INTO v_count
    FROM reservations
    WHERE reservation_number IS NULL 
       OR date IS NULL 
       OR start_time IS NULL 
       OR end_time IS NULL;
    
    IF v_count > 0 THEN
        RAISE NOTICE '% records with NULL values found', v_count;
    ELSE
        RAISE NOTICE 'All records have complete data';
    END IF;
END $$;

-- 마이그레이션 완료 메시지
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Please verify the data integrity and test the application.';
END $$;