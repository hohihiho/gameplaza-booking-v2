-- 게임플라자 기본 데이터 시드

-- 기기 타입 데이터
INSERT INTO device_types (id, name, description, hourly_rate, daily_max_hours, requires_approval, icon_url) VALUES
('ps5_type', 'PlayStation 5', '최신 플레이스테이션 5 게임 콘솔', 3000, 8, false, '/icons/ps5.svg'),
('switch_type', 'Nintendo Switch', '닌텐도 스위치 게임 콘솔', 2500, 8, false, '/icons/switch.svg'),
('pc_type', '게이밍 PC', '고성능 게이밍 PC', 4000, 8, false, '/icons/pc.svg'),
('vr_type', 'VR 체험존', '가상현실 게임 체험', 5000, 4, false, '/icons/vr.svg'),
('racing_type', '레이싱 시뮬레이터', '레이싱 게임 전용 시뮬레이터', 6000, 6, true, '/icons/racing.svg'),
('rhythm_type', '리듬게임기', '비트매니아, DDR 등', 3500, 8, false, '/icons/rhythm.svg');

-- 기기 데이터
INSERT INTO devices (id, name, device_type_id, status, location, specifications, notes) VALUES
-- PS5
('ps5_01', 'PS5-01', 'ps5_type', 'available', 'A구역-01', '{"storage": "825GB SSD", "controllers": 2, "hdr": true}', '메인 PS5 콘솔'),
('ps5_02', 'PS5-02', 'ps5_type', 'available', 'A구역-02', '{"storage": "825GB SSD", "controllers": 2, "hdr": true}', '서브 PS5 콘솔'),
('ps5_03', 'PS5-03', 'ps5_type', 'available', 'A구역-03', '{"storage": "825GB SSD", "controllers": 2, "hdr": true}', '예비 PS5 콘솔'),

-- Nintendo Switch
('switch_01', 'Switch-01', 'switch_type', 'available', 'B구역-01', '{"type": "OLED", "controllers": 4, "dock": true}', 'OLED 모델'),
('switch_02', 'Switch-02', 'switch_type', 'available', 'B구역-02', '{"type": "OLED", "controllers": 4, "dock": true}', 'OLED 모델'),
('switch_03', 'Switch-03', 'switch_type', 'available', 'B구역-03', '{"type": "Standard", "controllers": 2, "dock": true}', '일반 모델'),

-- 게이밍 PC
('pc_01', 'Gaming PC-01', 'pc_type', 'available', 'C구역-01', '{"cpu": "i7-13700K", "gpu": "RTX 4070", "ram": "32GB", "storage": "1TB NVMe"}', '고사양 PC'),
('pc_02', 'Gaming PC-02', 'pc_type', 'available', 'C구역-02', '{"cpu": "i5-13600K", "gpu": "RTX 4060", "ram": "16GB", "storage": "1TB NVMe"}', '중사양 PC'),

-- VR
('vr_01', 'VR Zone-01', 'vr_type', 'available', 'D구역-01', '{"headset": "Quest 3", "play_area": "4m x 4m", "tracking": "inside-out"}', 'VR 체험존 1'),
('vr_02', 'VR Zone-02', 'vr_type', 'available', 'D구역-02', '{"headset": "Quest 3", "play_area": "4m x 4m", "tracking": "inside-out"}', 'VR 체험존 2'),

-- 레이싱 시뮬레이터
('racing_01', 'Racing Sim-01', 'racing_type', 'available', 'E구역-01', '{"wheel": "Logitech G923", "pedals": "3-pedal", "seat": "Racing seat", "monitors": 3}', '3모니터 레이싱 시뮬레이터'),

-- 리듬게임기
('rhythm_01', '비트매니아-01', 'rhythm_type', 'available', 'F구역-01', '{"game": "Beatmania IIDX", "buttons": "9-button", "turntable": true}', '비트매니아 IIDX'),
('rhythm_02', 'DDR-01', 'rhythm_type', 'available', 'F구역-02', '{"game": "Dance Dance Revolution", "pads": 2, "difficulty": "Expert"}', 'DDR 머신');

-- 관리자 사용자 (실제 운영시에는 적절한 인증 시스템과 연동)
INSERT INTO users (id, email, name, role, created_at) VALUES
('admin_001', 'admin@gameplaza.kr', '관리자', 'admin', CURRENT_TIMESTAMP),
('super_admin', 'superadmin@gameplaza.kr', '슈퍼관리자', 'super_admin', CURRENT_TIMESTAMP);

-- 기본 시간대 템플릿 (평일 및 주말)
INSERT INTO time_slot_templates (name, day_of_week, start_time, end_time, is_active) VALUES
-- 평일 (월~금)
('평일 오전', 1, '10:00', '12:00', true),
('평일 오후1', 1, '12:00', '14:00', true),
('평일 오후2', 1, '14:00', '16:00', true),
('평일 오후3', 1, '16:00', '18:00', true),
('평일 저녁1', 1, '18:00', '20:00', true),
('평일 저녁2', 1, '20:00', '22:00', true),
('평일 밤1', 1, '22:00', '24:00', true),
('평일 밤2', 1, '24:00', '26:00', true),
('평일 새벽1', 1, '26:00', '28:00', true),
('평일 새벽2', 1, '28:00', '29:00', true),

-- 화요일
('평일 오전', 2, '10:00', '12:00', true),
('평일 오후1', 2, '12:00', '14:00', true),
('평일 오후2', 2, '14:00', '16:00', true),
('평일 오후3', 2, '16:00', '18:00', true),
('평일 저녁1', 2, '18:00', '20:00', true),
('평일 저녁2', 2, '20:00', '22:00', true),
('평일 밤1', 2, '22:00', '24:00', true),
('평일 밤2', 2, '24:00', '26:00', true),
('평일 새벽1', 2, '26:00', '28:00', true),
('평일 새벽2', 2, '28:00', '29:00', true),

-- 수요일
('평일 오전', 3, '10:00', '12:00', true),
('평일 오후1', 3, '12:00', '14:00', true),
('평일 오후2', 3, '14:00', '16:00', true),
('평일 오후3', 3, '16:00', '18:00', true),
('평일 저녁1', 3, '18:00', '20:00', true),
('평일 저녁2', 3, '20:00', '22:00', true),
('평일 밤1', 3, '22:00', '24:00', true),
('평일 밤2', 3, '24:00', '26:00', true),
('평일 새벽1', 3, '26:00', '28:00', true),
('평일 새벽2', 3, '28:00', '29:00', true),

-- 목요일
('평일 오전', 4, '10:00', '12:00', true),
('평일 오후1', 4, '12:00', '14:00', true),
('평일 오후2', 4, '14:00', '16:00', true),
('평일 오후3', 4, '16:00', '18:00', true),
('평일 저녁1', 4, '18:00', '20:00', true),
('평일 저녁2', 4, '20:00', '22:00', true),
('평일 밤1', 4, '22:00', '24:00', true),
('평일 밤2', 4, '24:00', '26:00', true),
('평일 새벽1', 4, '26:00', '28:00', true),
('평일 새벽2', 4, '28:00', '29:00', true),

-- 금요일
('평일 오전', 5, '10:00', '12:00', true),
('평일 오후1', 5, '12:00', '14:00', true),
('평일 오후2', 5, '14:00', '16:00', true),
('평일 오후3', 5, '16:00', '18:00', true),
('평일 저녁1', 5, '18:00', '20:00', true),
('평일 저녁2', 5, '20:00', '22:00', true),
('평일 밤1', 5, '22:00', '24:00', true),
('평일 밤2', 5, '24:00', '26:00', true),
('평일 새벽1', 5, '26:00', '28:00', true),
('평일 새벽2', 5, '28:00', '29:00', true),

-- 토요일
('주말 오전', 6, '10:00', '12:00', true),
('주말 오후1', 6, '12:00', '14:00', true),
('주말 오후2', 6, '14:00', '16:00', true),
('주말 오후3', 6, '16:00', '18:00', true),
('주말 저녁1', 6, '18:00', '20:00', true),
('주말 저녁2', 6, '20:00', '22:00', true),
('주말 밤1', 6, '22:00', '24:00', true),
('주말 밤2', 6, '24:00', '26:00', true),
('주말 새벽1', 6, '26:00', '28:00', true),
('주말 새벽2', 6, '28:00', '29:00', true),

-- 일요일
('주말 오전', 0, '10:00', '12:00', true),
('주말 오후1', 0, '12:00', '14:00', true),
('주말 오후2', 0, '14:00', '16:00', true),
('주말 오후3', 0, '16:00', '18:00', true),
('주말 저녁1', 0, '18:00', '20:00', true),
('주말 저녁2', 0, '20:00', '22:00', true),
('주말 밤1', 0, '22:00', '24:00', true),
('주말 밤2', 0, '24:00', '26:00', true),
('주말 새벽1', 0, '26:00', '28:00', true),
('주말 새벽2', 0, '28:00', '29:00', true);

-- 알림 템플릿
INSERT INTO notification_templates (name, title_template, body_template, type, is_active) VALUES
('reservation_confirmed', '예약 확정', '{{device_name}} 예약이 확정되었습니다. 시간: {{start_time}} ~ {{end_time}}', 'reservation_reminder', true),
('checkin_reminder_30min', '체크인 알림 (30분 전)', '{{device_name}} 예약 시간이 30분 남았습니다. 체크인을 준비해주세요.', 'checkin_reminder', true),
('checkin_reminder_10min', '체크인 알림 (10분 전)', '{{device_name}} 예약 시간이 10분 남았습니다. 지금 체크인해주세요.', 'checkin_reminder', true),
('overtime_warning', '연장 사용 알림', '예약 시간이 {{overtime_minutes}}분 초과되었습니다. 연장 요금이 부과될 수 있습니다.', 'system_notice', true),
('maintenance_notice', '기기 점검 안내', '{{device_name}}이 점검 중입니다. 이용에 불편을 드려 죄송합니다.', 'system_notice', true);