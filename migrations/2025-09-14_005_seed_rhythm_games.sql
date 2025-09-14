-- Rhythm game focused seed for device types, devices and rental time blocks

INSERT INTO device_types (id, name, is_rentable, display_order, model_name, version_name, description, rental_settings)
VALUES
  (1001, 'CHUNITHM', 1, 1, 'SEGA', NULL, '츄니즘', '{"display_order":1,"max_rental_units":3,"max_players":2}'),
  (1002, 'maimai', 1, 2, 'SEGA', NULL, '마이마이', '{"display_order":2,"max_rental_units":3,"max_players":2}'),
  (1003, 'SOUND VOLTEX', 1, 3, 'Valkyrie', NULL, '사볼 발키리 모델', '{"display_order":3,"max_rental_units":3,"max_players":1}'),
  (1004, 'beatmania IIDX', 1, 4, 'Lightning', NULL, '비매 라이트닝 모델', '{"display_order":4,"max_rental_units":2,"max_players":2}');

INSERT INTO device_types (id, name, is_rentable, display_order, model_name, version_name, description, rental_settings)
VALUES
  (1103, 'SOUND VOLTEX (Legacy)', 1, 13, 'KONAMI', 'Old (legacy)', '사운드볼텍스 구기체', '{"display_order":13,"max_rental_units":2,"max_players":1}'),
  (1104, 'beatmania IIDX (Legacy)', 1, 14, 'KONAMI', 'Old (legacy)', '비트매니아 구기체', '{"display_order":14,"max_rental_units":2,"max_players":2}');

INSERT INTO device_types (id, name, is_rentable, display_order, model_name, version_name, description, rental_settings)
VALUES
  (1201, 'jubeat', 1, 21, 'KONAMI', NULL, '유비트', '{"display_order":21,"max_rental_units":4,"max_players":2}'),
  (1202, 'pop''n music', 1, 22, 'KONAMI', NULL, '팝픈', '{"display_order":22,"max_rental_units":2,"max_players":2}'),
  (1203, 'GITADORA Guitar', 1, 23, 'Arena', NULL, '기타도라 기타(아레나)', '{"display_order":23,"max_rental_units":2,"max_players":1}'),
  (1204, 'GITADORA Drum', 1, 24, 'Arena', NULL, '기타도라 드럼(아레나)', '{"display_order":24,"max_rental_units":2,"max_players":1}'),
  (1205, 'DJMAX TECHNIKA', 1, 25, 'Pentavision', NULL, '테크니카', '{"display_order":25,"max_rental_units":1,"max_players":2}'),
  (1206, 'Taiko no Tatsujin', 1, 26, 'BANDAI NAMCO', NULL, '태고의 달인', '{"display_order":26,"max_rental_units":2,"max_players":2}'),
  (1207, 'EZ2DJ', 1, 27, 'Square Pixels', NULL, '이지투디제이', '{"display_order":27,"max_rental_units":2,"max_players":2}'),
  (1208, 'REFLEC BEAT', 1, 28, 'KONAMI', NULL, '리플렉비트', '{"display_order":28,"max_rental_units":2,"max_players":2}'),
  (1209, 'NOSTALGIA', 1, 29, 'KONAMI', NULL, '노스텔지어', '{"display_order":29,"max_rental_units":2,"max_players":2}'),
  (1210, 'DanceDanceRevolution', 1, 30, 'KONAMI', NULL, 'DDR', '{"display_order":30,"max_rental_units":2,"max_players":2}'),
  (1211, 'PUMP IT UP', 1, 31, 'Andamiro', NULL, '펌프', '{"display_order":31,"max_rental_units":2,"max_players":2}'),
  (1212, 'WACCA', 1, 32, 'Marvelous', NULL, '왓카', '{"display_order":32,"max_rental_units":1,"max_players":2}');

INSERT INTO devices (id, device_type_id, device_number, status)
VALUES
  -- CHUNITHM 3대
  ('00000000-0000-0000-0000-000000100101', 1001, 1, 'available'),
  ('00000000-0000-0000-0000-000000100102', 1001, 2, 'available'),
  ('00000000-0000-0000-0000-000000100103', 1001, 3, 'available'),
  -- maimai 4대
  ('00000000-0000-0000-0000-000000100201', 1002, 1, 'available'),
  ('00000000-0000-0000-0000-000000100202', 1002, 2, 'available'),
  ('00000000-0000-0000-0000-000000100203', 1002, 3, 'available'),
  ('00000000-0000-0000-0000-000000100204', 1002, 4, 'available'),
  -- SDVX Valkyrie 13대
  ('00000000-0000-0000-0000-000000100301', 1003, 1, 'available'),
  ('00000000-0000-0000-0000-000000100302', 1003, 2, 'available'),
  ('00000000-0000-0000-0000-000000100303', 1003, 3, 'available'),
  ('00000000-0000-0000-0000-000000100304', 1003, 4, 'available'),
  ('00000000-0000-0000-0000-000000100305', 1003, 5, 'available'),
  ('00000000-0000-0000-0000-000000100306', 1003, 6, 'available'),
  ('00000000-0000-0000-0000-000000100307', 1003, 7, 'available'),
  ('00000000-0000-0000-0000-000000100308', 1003, 8, 'available'),
  ('00000000-0000-0000-0000-000000100309', 1003, 9, 'available'),
  ('00000000-0000-0000-0000-00000010030A', 1003, 10, 'available'),
  ('00000000-0000-0000-0000-00000010030B', 1003, 11, 'available'),
  ('00000000-0000-0000-0000-00000010030C', 1003, 12, 'available'),
  ('00000000-0000-0000-0000-00000010030D', 1003, 13, 'available'),
  -- IIDX Lightning 1대
  ('00000000-0000-0000-0000-000000100401', 1004, 1, 'available'),
  ('00000000-0000-0000-0000-000000110301', 1103, 1, 'available'),
  ('00000000-0000-0000-0000-000000110401', 1104, 1, 'available'),
  ('00000000-0000-0000-0000-000000120101', 1201, 1, 'available'),
  ('00000000-0000-0000-0000-000000120201', 1202, 1, 'available'),
  ('00000000-0000-0000-0000-000000120301', 1203, 1, 'available'),
  ('00000000-0000-0000-0000-000000120401', 1204, 1, 'available'),
  ('00000000-0000-0000-0000-000000120501', 1205, 1, 'available'),
  ('00000000-0000-0000-0000-000000120601', 1206, 1, 'available'),
  ('00000000-0000-0000-0000-000000120701', 1207, 1, 'available'),
  ('00000000-0000-0000-0000-000000120801', 1208, 1, 'available'),
  ('00000000-0000-0000-0000-000000120901', 1209, 1, 'available'),
  ('00000000-0000-0000-0000-000000121001', 1210, 1, 'available'),
  ('00000000-0000-0000-0000-000000121101', 1211, 1, 'available'),
  ('00000000-0000-0000-0000-000000121201', 1212, 1, 'available');

INSERT INTO rental_time_blocks (device_type_id, slot_type, start_time, end_time, enable_extra_people, extra_per_person, is_youth_time)
VALUES
  -- CHUNITHM (07-12, 08-12, 09-13(청소년), 24-28)
  (1001, 'early', '07:00:00', '12:00:00', 0, NULL, 0),
  (1001, 'early', '08:00:00', '12:00:00', 0, NULL, 0),
  (1001, 'early', '09:00:00', '13:00:00', 0, NULL, 1),
  (1001, 'overnight', '24:00:00', '28:00:00', 0, NULL, 0),
  -- maimai (07-12, 08-12, 09-13(청소년), 24-28) + 2인 옵션
  (1002, 'early', '07:00:00', '12:00:00', 1, 10000, 0),
  (1002, 'early', '08:00:00', '12:00:00', 1, 10000, 0),
  (1002, 'early', '09:00:00', '13:00:00', 1, 10000, 1),
  (1002, 'overnight', '24:00:00', '28:00:00', 1, 10000, 0),
  -- SOUND VOLTEX (Valkyrie) (07-12, 08-12, 09-13(청소년), 24-29)
  (1003, 'early', '07:00:00', '12:00:00', 0, NULL, 0),
  (1003, 'early', '08:00:00', '12:00:00', 0, NULL, 0),
  (1003, 'early', '09:00:00', '13:00:00', 0, NULL, 1),
  (1003, 'overnight', '24:00:00', '29:00:00', 0, NULL, 0),
  -- beatmania IIDX (Lightning) (07-12, 08-12, 09-13(청소년), 24-29)
  (1004, 'early', '07:00:00', '12:00:00', 0, NULL, 0),
  (1004, 'early', '08:00:00', '12:00:00', 0, NULL, 0),
  (1004, 'early', '09:00:00', '13:00:00', 0, NULL, 1),
  (1004, 'overnight', '24:00:00', '29:00:00', 0, NULL, 0);

