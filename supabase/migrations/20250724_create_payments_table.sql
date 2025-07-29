-- 결제 테이블 생성
-- PaymentSupabaseRepository와 일치하도록 스키마 정의

-- 결제 상태 ENUM 생성
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'cancelled', 'refunded', 'partial_refunded');
    END IF;
END $$;

-- 결제 방법 ENUM 생성
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer');
    END IF;
END $$;

-- payments 테이블 생성
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  method payment_method NOT NULL DEFAULT 'cash',
  status payment_status NOT NULL DEFAULT 'pending',
  transaction_id VARCHAR(255), -- 내부 거래 번호
  receipt_number VARCHAR(100), -- 영수증 번호
  paid_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_reason TEXT,
  refunded_at TIMESTAMP WITH TIME ZONE,
  refunded_amount INTEGER CHECK (refunded_amount >= 0),
  refund_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_payments_reservation ON payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(method);
CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_date_range ON payments(created_at) WHERE status IN ('completed', 'refunded', 'partial_refunded');

-- updated_at 자동 업데이트 트리거 추가
DROP TRIGGER IF EXISTS trigger_payments_updated_at ON payments;
CREATE TRIGGER trigger_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) 활성화
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
-- 사용자는 자신의 결제 정보만 조회 가능
CREATE POLICY "Users can view own payments" ON payments 
  FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 결제를 생성할 수 있음
CREATE POLICY "Users can create own payments" ON payments 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 결제 정보에 접근 가능
CREATE POLICY "Admins can manage all payments" ON payments 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins a 
      JOIN users u ON a.user_id = u.id 
      WHERE u.id = auth.uid()
    )
  );

-- 제약조건 추가
ALTER TABLE payments ADD CONSTRAINT payments_refund_amount_check 
  CHECK (refunded_amount IS NULL OR refunded_amount <= amount);

ALTER TABLE payments ADD CONSTRAINT payments_paid_at_check 
  CHECK ((status = 'completed' AND paid_at IS NOT NULL) OR (status != 'completed'));

ALTER TABLE payments ADD CONSTRAINT payments_cancelled_check 
  CHECK ((status = 'cancelled' AND cancelled_at IS NOT NULL) OR (status != 'cancelled'));

ALTER TABLE payments ADD CONSTRAINT payments_refunded_check 
  CHECK ((status IN ('refunded', 'partial_refunded') AND refunded_at IS NOT NULL) OR 
         (status NOT IN ('refunded', 'partial_refunded')));

-- 테이블 및 컬럼 설명 추가
COMMENT ON TABLE payments IS '결제 정보 테이블';
COMMENT ON COLUMN payments.reservation_id IS '예약 ID (외래키)';
COMMENT ON COLUMN payments.user_id IS '사용자 ID (외래키)';
COMMENT ON COLUMN payments.amount IS '결제 금액 (원)';
COMMENT ON COLUMN payments.method IS '결제 방법: cash(현금), bank_transfer(계좌이체)';
COMMENT ON COLUMN payments.status IS '결제 상태: pending(대기), completed(완료), cancelled(취소), refunded(환불), partial_refunded(부분환불)';
COMMENT ON COLUMN payments.transaction_id IS '내부 거래 번호';
COMMENT ON COLUMN payments.receipt_number IS '영수증 번호';
COMMENT ON COLUMN payments.paid_at IS '결제 완료 시각';
COMMENT ON COLUMN payments.cancelled_at IS '결제 취소 시각';
COMMENT ON COLUMN payments.refunded_at IS '환불 처리 시각';
COMMENT ON COLUMN payments.refunded_amount IS '환불 금액 (원)';
COMMENT ON COLUMN payments.metadata IS '추가 정보 (JSON)';