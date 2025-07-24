-- 관리자 테이블 생성
CREATE TABLE IF NOT EXISTS admins (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL UNIQUE,
  permissions JSONB NOT NULL DEFAULT '{
    "reservations": false,
    "users": false,
    "devices": false,
    "cms": false,
    "settings": false
  }'::jsonb,
  isSuperAdmin BOOLEAN NOT NULL DEFAULT false,
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- 외래 키 제약
  CONSTRAINT fk_admin_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX idx_admins_userId ON admins(userId);
CREATE INDEX idx_admins_isSuperAdmin ON admins(isSuperAdmin);

-- 업데이트 트리거 생성
CREATE OR REPLACE FUNCTION update_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admins_updated_at_trigger
  BEFORE UPDATE ON admins
  FOR EACH ROW
  EXECUTE FUNCTION update_admins_updated_at();

-- RLS (Row Level Security) 정책 설정
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 슈퍼관리자만 관리자 테이블을 조회할 수 있음
CREATE POLICY "Super admins can view all admins" ON admins
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.userId = auth.uid()
      AND a.isSuperAdmin = true
    )
  );

-- 슈퍼관리자만 관리자를 생성할 수 있음
CREATE POLICY "Super admins can create admins" ON admins
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.userId = auth.uid()
      AND a.isSuperAdmin = true
    )
  );

-- 슈퍼관리자만 관리자를 업데이트할 수 있음 (단, 자기 자신 제외)
CREATE POLICY "Super admins can update other admins" ON admins
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.userId = auth.uid()
      AND a.isSuperAdmin = true
    )
    AND userId != auth.uid()
  );

-- 슈퍼관리자만 관리자를 삭제할 수 있음 (단, 자기 자신과 다른 슈퍼관리자 제외)
CREATE POLICY "Super admins can delete regular admins" ON admins
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.userId = auth.uid()
      AND a.isSuperAdmin = true
    )
    AND userId != auth.uid()
    AND isSuperAdmin = false
  );

-- 코멘트 추가
COMMENT ON TABLE admins IS '관리자 정보를 저장하는 테이블';
COMMENT ON COLUMN admins.id IS '관리자 고유 ID';
COMMENT ON COLUMN admins.userId IS '연결된 사용자 ID (users 테이블 참조)';
COMMENT ON COLUMN admins.permissions IS '관리자 권한 JSON (reservations, users, devices, cms, settings)';
COMMENT ON COLUMN admins.isSuperAdmin IS '슈퍼관리자 여부';
COMMENT ON COLUMN admins.createdAt IS '생성 일시';
COMMENT ON COLUMN admins.updatedAt IS '수정 일시';