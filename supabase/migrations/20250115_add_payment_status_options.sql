-- payment_status enum에 partial_refund와 refunded 추가
-- 비전공자 설명: 부분 환불과 전체 환불 상태를 구분하기 위해 결제 상태 옵션을 추가합니다

-- 기존 enum 타입 확인 및 새로운 값 추가
DO $$ 
BEGIN
    -- payment_status가 enum이 아닌 경우를 대비하여 처리
    IF EXISTS (
        SELECT 1 
        FROM pg_type t 
        JOIN pg_namespace n ON t.typnamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND t.typname = 'payment_status_enum'
    ) THEN
        -- 기존 enum에 새로운 값 추가
        ALTER TYPE payment_status_enum ADD VALUE IF NOT EXISTS 'partial_refund';
        ALTER TYPE payment_status_enum ADD VALUE IF NOT EXISTS 'refunded';
    ELSE
        -- enum이 없는 경우 text 필드에 CHECK 제약조건 추가/업데이트
        ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_payment_status_check;
        ALTER TABLE reservations ADD CONSTRAINT reservations_payment_status_check 
        CHECK (payment_status IN ('pending', 'confirmed', 'partial_refund', 'refunded'));
    END IF;
END $$;

-- 취소 관련 필드 추가 (없는 경우에만)
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES users(id);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- 필드 설명 추가
COMMENT ON COLUMN reservations.payment_status IS '결제 상태: pending(대기중), confirmed(확인됨), partial_refund(부분환불), refunded(전체환불)';
COMMENT ON COLUMN reservations.cancelled_at IS '취소 처리 시각';
COMMENT ON COLUMN reservations.cancelled_by IS '취소 처리한 관리자';
COMMENT ON COLUMN reservations.cancellation_reason IS '취소 사유';