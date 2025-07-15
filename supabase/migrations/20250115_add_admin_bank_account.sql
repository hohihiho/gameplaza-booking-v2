-- 관리자별 계좌번호 설정을 위한 컬럼 추가
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS bank_account JSONB DEFAULT NULL;

-- bank_account 구조 예시:
-- {
--   "bank": "카카오뱅크",
--   "account": "3333-01-1234567",
--   "holder": "홍길동"
-- }

-- 기존 관리자에게 기본 계좌 정보 설정 (settings의 payment_info를 사용)
UPDATE admins
SET bank_account = (
  SELECT value 
  FROM settings 
  WHERE key = 'payment_info'
  LIMIT 1
)
WHERE bank_account IS NULL;

-- 관리자 계좌 정보 조회를 위한 함수
CREATE OR REPLACE FUNCTION get_admin_bank_account(admin_email TEXT)
RETURNS JSONB AS $$
DECLARE
    account_info JSONB;
BEGIN
    -- 관리자의 계좌 정보 조회
    SELECT a.bank_account INTO account_info
    FROM admins a
    JOIN users u ON u.id = a.user_id
    WHERE u.email = admin_email;
    
    -- 계좌 정보가 없으면 기본 설정 반환
    IF account_info IS NULL THEN
        SELECT value INTO account_info
        FROM settings
        WHERE key = 'payment_info'
        LIMIT 1;
    END IF;
    
    RETURN account_info;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 관리자 계좌 정보 업데이트를 위한 함수
CREATE OR REPLACE FUNCTION update_admin_bank_account(
    admin_email TEXT,
    bank_name TEXT,
    account_number TEXT,
    account_holder TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE admins
    SET bank_account = jsonb_build_object(
        'bank', bank_name,
        'account', account_number,
        'holder', account_holder
    ),
    updated_at = NOW()
    FROM users u
    WHERE u.id = admins.user_id
    AND u.email = admin_email;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;