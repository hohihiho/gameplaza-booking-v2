-- play_modes 테이블 RLS 정책 추가
CREATE POLICY "Anyone can insert play modes" ON play_modes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update play modes" ON play_modes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete play modes" ON play_modes FOR DELETE USING (true);

-- device_types 테이블 RLS 정책 추가
CREATE POLICY "Anyone can insert device types" ON device_types FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update device types" ON device_types FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete device types" ON device_types FOR DELETE USING (true);

-- devices 테이블 RLS 정책 추가
CREATE POLICY "Anyone can insert devices" ON devices FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update devices" ON devices FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete devices" ON devices FOR DELETE USING (true);

-- rental_settings 테이블 RLS 정책 추가
CREATE POLICY "Anyone can insert rental settings" ON rental_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update rental settings" ON rental_settings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete rental settings" ON rental_settings FOR DELETE USING (true);

-- 참고: 이 정책들은 개발 환경용입니다.
-- 운영 환경에서는 관리자 인증을 확인하는 더 엄격한 정책으로 변경해야 합니다.
-- 예시:
-- CREATE POLICY "Only admins can modify play modes" ON play_modes 
--   FOR ALL 
--   USING (auth.uid() IN (SELECT user_id FROM admins))
--   WITH CHECK (auth.uid() IN (SELECT user_id FROM admins));