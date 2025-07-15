-- 관리자를 위한 RLS 정책 추가
-- 관리자는 모든 예약을 조회/수정 가능

-- 관리자 확인 함수
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 정책 삭제 및 새 정책 생성
DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update own pending reservations" ON reservations;

-- 예약 조회 정책
CREATE POLICY "Users can view own reservations" ON reservations 
FOR SELECT 
USING (auth.uid() = user_id OR is_admin());

-- 예약 수정 정책 (관리자는 모든 예약 수정 가능)
CREATE POLICY "Users can update own pending reservations" ON reservations 
FOR UPDATE 
USING (
  (auth.uid() = user_id AND status = 'pending') 
  OR is_admin()
);

-- 관리자는 모든 사용자 정보 조회 가능
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view profiles" ON users 
FOR SELECT 
USING (auth.uid() = id OR is_admin());

-- 관리자는 모든 기기 상태 수정 가능
CREATE POLICY "Admins can update devices" ON devices 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can select devices" ON devices 
FOR SELECT 
USING (true); -- 모든 사용자가 기기 정보 조회 가능

-- machines 테이블에도 동일한 정책 적용
CREATE POLICY "Admins can update machines" ON machines 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Anyone can select machines" ON machines 
FOR SELECT 
USING (true);

-- 관리자 로그는 관리자만 생성/조회 가능
CREATE POLICY "Admins can insert logs" ON admin_logs 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can view logs" ON admin_logs 
FOR SELECT 
USING (is_admin());