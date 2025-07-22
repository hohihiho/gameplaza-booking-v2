-- 결제 계좌 테이블 생성
CREATE TABLE IF NOT EXISTS payment_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_name VARCHAR(50) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_holder VARCHAR(50) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_payment_accounts_is_primary ON payment_accounts(is_primary);
CREATE INDEX idx_payment_accounts_is_active ON payment_accounts(is_active);

-- RLS 정책 (슈퍼 관리자만 접근 가능)
ALTER TABLE payment_accounts ENABLE ROW LEVEL SECURITY;

-- 슈퍼 관리자만 조회 가능
CREATE POLICY "Super admins can view payment accounts" ON payment_accounts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_super_admin = true
    )
  );

-- 슈퍼 관리자만 생성 가능
CREATE POLICY "Super admins can create payment accounts" ON payment_accounts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_super_admin = true
    )
  );

-- 슈퍼 관리자만 수정 가능
CREATE POLICY "Super admins can update payment accounts" ON payment_accounts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_super_admin = true
    )
  );

-- 슈퍼 관리자만 삭제 가능
CREATE POLICY "Super admins can delete payment accounts" ON payment_accounts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.user_id = auth.uid()
      AND admins.is_super_admin = true
    )
  );

-- 기본 계좌는 하나만 있도록 보장하는 트리거
CREATE OR REPLACE FUNCTION ensure_single_primary_account()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE payment_accounts 
    SET is_primary = false 
    WHERE id != NEW.id AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_primary_account
BEFORE INSERT OR UPDATE ON payment_accounts
FOR EACH ROW
EXECUTE FUNCTION ensure_single_primary_account();

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_payment_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_accounts_timestamp
BEFORE UPDATE ON payment_accounts
FOR EACH ROW
EXECUTE FUNCTION update_payment_accounts_updated_at();