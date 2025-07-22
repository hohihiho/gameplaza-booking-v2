-- Supabase RLS 정책 최적화 스크립트
-- 실행 날짜: 2025-07-22
-- 목적: SELECT 래핑으로 RLS 성능 향상

-- ============================================
-- 1. users 테이블 RLS 정책 최적화
-- ============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- 최적화된 정책 생성
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- ============================================
-- 2. reservations 테이블 RLS 정책 최적화
-- ============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update own reservations" ON reservations;

-- 최적화된 정책 생성
CREATE POLICY "Users can view own reservations" ON reservations
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can create reservations" ON reservations
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own reservations" ON reservations
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================
-- 3. rental_slots 테이블 RLS 정책 최적화
-- ============================================

-- 모든 사용자가 슬롯 조회 가능
DROP POLICY IF EXISTS "Anyone can view rental slots" ON rental_slots;

CREATE POLICY "Anyone can view rental slots" ON rental_slots
  FOR SELECT
  TO public
  USING (true);

-- 관리자만 슬롯 생성/수정/삭제 가능
DROP POLICY IF EXISTS "Only admins can manage rental slots" ON rental_slots;

CREATE POLICY "Only admins can manage rental slots" ON rental_slots
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = (SELECT auth.uid())
    )
  );

-- ============================================
-- 4. devices 테이블 RLS 정책 최적화
-- ============================================

-- 모든 사용자가 기기 조회 가능
DROP POLICY IF EXISTS "Anyone can view devices" ON devices;

CREATE POLICY "Anyone can view devices" ON devices
  FOR SELECT
  TO public
  USING (is_active = true);

-- 관리자만 기기 관리 가능
DROP POLICY IF EXISTS "Only admins can manage devices" ON devices;

CREATE POLICY "Only admins can manage devices" ON devices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = (SELECT auth.uid())
    )
  );

-- ============================================
-- 5. 성능 향상을 위한 인덱스 추가
-- ============================================

-- reservations 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_rental_slot_id ON reservations(rental_slot_id);

-- rental_slots 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_rental_slots_date ON rental_slots(date);
CREATE INDEX IF NOT EXISTS idx_rental_slots_start_time ON rental_slots(start_time);
CREATE INDEX IF NOT EXISTS idx_rental_slots_device_id ON rental_slots(device_id);
CREATE INDEX IF NOT EXISTS idx_rental_slots_is_reserved ON rental_slots(is_reserved);

-- devices 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_devices_is_active ON devices(is_active);
CREATE INDEX IF NOT EXISTS idx_devices_device_type_id ON devices(device_type_id);

-- users 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- admins 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_admins_id ON admins(id);

-- ============================================
-- 6. 함수 기반 RLS 최적화 (예시)
-- ============================================

-- 관리자 확인 함수 (SECURITY DEFINER로 성능 향상)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins 
    WHERE id = auth.uid()
  );
$$;

-- 사용자의 예약 가능 여부 확인 함수
CREATE OR REPLACE FUNCTION can_make_reservation(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM reservations
    WHERE user_id = p_user_id
    AND status IN ('pending', 'confirmed')
    AND date >= CURRENT_DATE
  );
$$;

-- ============================================
-- 실행 완료 메시지
-- ============================================
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요.
-- 실행 후 RLS 정책이 올바르게 작동하는지 테스트하세요.