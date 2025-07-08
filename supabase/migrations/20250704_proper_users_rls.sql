-- users 테이블의 올바른 RLS 정책 설정

-- 기존 정책 모두 삭제
DROP POLICY IF EXISTS "Anyone can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- 1. SELECT 정책: 자기 자신의 정보는 볼 수 있음
CREATE POLICY "Users can view own data" ON users
  FOR SELECT
  USING (
    -- auth.users의 email과 users 테이블의 email이 일치
    (auth.jwt() ->> 'email')::text = email
  );

-- 2. INSERT 정책: NextAuth 로그인 시 자동 생성을 위해
CREATE POLICY "Service role can create users" ON users
  FOR INSERT
  WITH CHECK (
    -- Service role만 가능 (supabaseAdmin 사용 시)
    auth.role() = 'service_role'
    OR
    -- 또는 자기 자신의 이메일로 생성
    (auth.jwt() ->> 'email')::text = email
  );

-- 3. UPDATE 정책: 자기 정보만 수정 가능
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  USING ((auth.jwt() ->> 'email')::text = email)
  WITH CHECK ((auth.jwt() ->> 'email')::text = email);

-- 4. 관리자는 모든 사용자 정보 조회 가능
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id::text = auth.uid()::text
    )
  );

-- 5. 관리자는 모든 사용자 정보 수정 가능
CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id::text = auth.uid()::text
    )
  );