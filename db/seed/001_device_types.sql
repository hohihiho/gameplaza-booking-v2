-- Device types seed data
INSERT OR IGNORE INTO device_types (id, name, display_name, description, icon, color, sort_order) VALUES
('ps5', 'ps5', 'PlayStation 5', '최신 게임을 4K HDR로 즐길 수 있는 플레이스테이션 5', 'gamepad-2', 'blue', 1),
('nintendo-switch', 'nintendo-switch', '닌텐도 스위치', '휴대용과 거치형을 자유롭게 즐길 수 있는 닌텐도 스위치', 'gamepad', 'red', 2),
('pc-room', 'pc-room', 'PC방', '고성능 게이밍 PC로 다양한 게임을 플레이', 'monitor', 'green', 3),
('racing-sim', 'racing-sim', '레이싱 시뮬레이터', '실감나는 레이싱 게임 전용 시뮬레이터', 'car', 'orange', 4),
('beatmania', 'beatmania', '비트매니아', '리듬 게임의 대표작 비트매니아 IIDX', 'music', 'purple', 5);

-- Sample devices for each type
INSERT OR IGNORE INTO devices (device_type_id, name, position) VALUES
-- PS5 devices
('ps5', 'PS5 #1', 1),
('ps5', 'PS5 #2', 2),
('ps5', 'PS5 #3', 3),
-- Nintendo Switch devices  
('nintendo-switch', '스위치 #1', 1),
('nintendo-switch', '스위치 #2', 2),
-- PC Room
('pc-room', 'PC #1', 1),
('pc-room', 'PC #2', 2),
('pc-room', 'PC #3', 3),
('pc-room', 'PC #4', 4),
-- Racing Simulator
('racing-sim', '레이싱 시뮬레이터 #1', 1),
-- Beatmania
('beatmania', '비트매니아 #1', 1),
('beatmania', '비트매니아 #2', 2);

-- Rental settings for each device type
INSERT OR IGNORE INTO rental_settings (device_type_id, max_rental_units, min_rental_hours, max_rental_hours) VALUES
('ps5', 3, 1, 12),
('nintendo-switch', 2, 1, 8),
('pc-room', 4, 1, 24),
('racing-sim', 1, 1, 6),
('beatmania', 1, 1, 4);

-- Time slots for early rental (조기 대여)
INSERT OR IGNORE INTO rental_time_slots (device_type_id, slot_type, start_time, end_time, credit_options, enable_2p) VALUES
-- PS5 early slots
('ps5', 'early', '14:00', '18:00', '[{"type": "fixed", "hours": [2, 3, 4], "prices": {"2": 20000, "3": 28000, "4": 35000}, "fixed_credits": 0}, {"type": "freeplay", "hours": [2, 3, 4], "prices": {"2": 25000, "3": 35000, "4": 45000}}]', 1),
-- Nintendo Switch early slots
('nintendo-switch', 'early', '14:00', '18:00', '[{"type": "fixed", "hours": [2, 3, 4], "prices": {"2": 15000, "3": 22000, "4": 28000}, "fixed_credits": 0}]', 1),
-- PC Room early slots
('pc-room', 'early', '14:00', '22:00', '[{"type": "unlimited", "hours": [4, 6, 8], "prices": {"4": 30000, "6": 40000, "8": 50000}}]', 0),
-- Racing Simulator early slots
('racing-sim', 'early', '14:00', '20:00', '[{"type": "fixed", "hours": [1, 2, 3], "prices": {"1": 15000, "2": 25000, "3": 35000}, "fixed_credits": 10}]', 0),
-- Beatmania early slots
('beatmania', 'early', '14:00', '20:00', '[{"type": "fixed", "hours": [1, 2], "prices": {"1": 8000, "2": 15000}, "fixed_credits": 20}]', 0);

-- Time slots for overnight rental (밤샘 대여)
INSERT OR IGNORE INTO rental_time_slots (device_type_id, slot_type, start_time, end_time, credit_options, enable_2p, is_youth_time) VALUES
-- PS5 overnight slots (청소년 시간대 제외)
('ps5', 'overnight', '22:00', '06:00', '[{"type": "freeplay", "hours": [8], "prices": {"8": 80000}}]', 1, 0),
-- Nintendo Switch overnight slots
('nintendo-switch', 'overnight', '22:00', '06:00', '[{"type": "fixed", "hours": [8], "prices": {"8": 60000}, "fixed_credits": 0}]', 1, 0),
-- PC Room overnight slots
('pc-room', 'overnight', '22:00', '06:00', '[{"type": "unlimited", "hours": [8, 10, 12], "prices": {"8": 70000, "10": 85000, "12": 100000}}]', 0, 0);

-- Racing Simulator overnight slots (운영 안함)
-- Beatmania overnight slots (운영 안함)