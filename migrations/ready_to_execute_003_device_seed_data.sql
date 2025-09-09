-- 카테고리 데이터 삽입
INSERT INTO device_categories (name, display_order) VALUES
  ('SEGA', 1),
  ('KONAMI', 2),
  ('BANDAI NAMCO', 3),
  ('기타', 4)
ON CONFLICT (name) DO NOTHING;

-- 기기 타입 데이터 삽입
WITH categories AS (
  SELECT id, name FROM device_categories
)
INSERT INTO device_types (category_id, name, description, is_rentable) VALUES
  -- SEGA
  ((SELECT id FROM categories WHERE name = 'SEGA'), '마이마이 DX', '터치스크린 리듬게임', true),
  ((SELECT id FROM categories WHERE name = 'SEGA'), '춘리즘', '체감형 리듬게임', true),
  ((SELECT id FROM categories WHERE name = 'SEGA'), 'WACCA', '원형 터치 리듬게임', false),
  
  -- KONAMI
  ((SELECT id FROM categories WHERE name = 'KONAMI'), '사운드 볼텍스', '노브 컨트롤러 리듬게임', true),
  ((SELECT id FROM categories WHERE name = 'KONAMI'), 'beatmania IIDX', '7키+턴테이블 리듬게임', true),
  ((SELECT id FROM categories WHERE name = 'KONAMI'), '유비트', '16버튼 리듬게임', false),
  ((SELECT id FROM categories WHERE name = 'KONAMI'), 'DDR', '댄스 리듬게임', true),
  
  -- BANDAI NAMCO
  ((SELECT id FROM categories WHERE name = 'BANDAI NAMCO'), '태고의 달인', '북 리듬게임', true),
  ((SELECT id FROM categories WHERE name = 'BANDAI NAMCO'), '철권 7', '대전격투게임', false),
  
  -- 기타
  ((SELECT id FROM categories WHERE name = '기타'), 'GROOVE COASTER', '터치바 리듬게임', false)
ON CONFLICT DO NOTHING;

-- 플레이 모드 데이터 삽입
WITH device_type_data AS (
  SELECT id, name FROM device_types
)
INSERT INTO play_modes (device_type_id, name, price, display_order) VALUES
  -- 마이마이 DX
  ((SELECT id FROM device_type_data WHERE name = '마이마이 DX'), '스탠다드', 1000, 1),
  ((SELECT id FROM device_type_data WHERE name = '마이마이 DX'), 'DX', 1500, 2),
  
  -- 사운드 볼텍스
  ((SELECT id FROM device_type_data WHERE name = '사운드 볼텍스'), '라이트', 1000, 1),
  ((SELECT id FROM device_type_data WHERE name = '사운드 볼텍스'), '스탠다드', 1500, 2),
  ((SELECT id FROM device_type_data WHERE name = '사운드 볼텍스'), '프리미엄', 2000, 3),
  
  -- beatmania IIDX
  ((SELECT id FROM device_type_data WHERE name = 'beatmania IIDX'), '스탠다드', 1500, 1),
  ((SELECT id FROM device_type_data WHERE name = 'beatmania IIDX'), '프리미엄', 2000, 2),
  
  -- 춘리즘
  ((SELECT id FROM device_type_data WHERE name = '춘리즘'), '스탠다드', 1000, 1),
  ((SELECT id FROM device_type_data WHERE name = '춘리즘'), '파라다이스', 1500, 2),
  
  -- DDR
  ((SELECT id FROM device_type_data WHERE name = 'DDR'), '싱글', 1000, 1),
  ((SELECT id FROM device_type_data WHERE name = 'DDR'), '더블', 1500, 2),
  
  -- 태고의 달인
  ((SELECT id FROM device_type_data WHERE name = '태고의 달인'), '스탠다드', 1000, 1)
ON CONFLICT DO NOTHING;

-- 대여 설정 데이터 삽입
WITH device_type_data AS (
  SELECT id, name FROM device_types WHERE is_rentable = true
)
INSERT INTO rental_settings (device_type_id, base_price, credit_types, fixed_credits, max_players, price_multiplier_2p) VALUES
  -- 마이마이 DX
  ((SELECT id FROM device_type_data WHERE name = '마이마이 DX'), 50000, ARRAY['freeplay', 'unlimited'], NULL, 2, 1.5),
  
  -- 사운드 볼텍스
  ((SELECT id FROM device_type_data WHERE name = '사운드 볼텍스'), 40000, ARRAY['fixed', 'freeplay'], 10, 1, 1.0),
  
  -- beatmania IIDX
  ((SELECT id FROM device_type_data WHERE name = 'beatmania IIDX'), 40000, ARRAY['fixed', 'freeplay'], 8, 1, 1.0),
  
  -- 춘리즘
  ((SELECT id FROM device_type_data WHERE name = '춘리즘'), 45000, ARRAY['freeplay', 'unlimited'], NULL, 1, 1.0),
  
  -- DDR
  ((SELECT id FROM device_type_data WHERE name = 'DDR'), 35000, ARRAY['freeplay', 'unlimited'], NULL, 2, 1.5),
  
  -- 태고의 달인
  ((SELECT id FROM device_type_data WHERE name = '태고의 달인'), 30000, ARRAY['fixed', 'freeplay', 'unlimited'], 15, 2, 1.3)
ON CONFLICT (device_type_id) DO NOTHING;

-- 개별 기기 데이터 삽입
WITH device_type_data AS (
  SELECT id, name FROM device_types
)
INSERT INTO devices (device_type_id, device_number, status) VALUES
  -- 마이마이 DX (2대)
  ((SELECT id FROM device_type_data WHERE name = '마이마이 DX'), 1, 'available'),
  ((SELECT id FROM device_type_data WHERE name = '마이마이 DX'), 2, 'available'),
  
  -- 사운드 볼텍스 (3대)
  ((SELECT id FROM device_type_data WHERE name = '사운드 볼텍스'), 1, 'maintenance'),
  ((SELECT id FROM device_type_data WHERE name = '사운드 볼텍스'), 2, 'available'),
  ((SELECT id FROM device_type_data WHERE name = '사운드 볼텍스'), 3, 'available'),
  
  -- beatmania IIDX (2대)
  ((SELECT id FROM device_type_data WHERE name = 'beatmania IIDX'), 1, 'available'),
  ((SELECT id FROM device_type_data WHERE name = 'beatmania IIDX'), 2, 'available'),
  
  -- 춘리즘 (1대)
  ((SELECT id FROM device_type_data WHERE name = '춘리즘'), 1, 'available'),
  
  -- DDR (2대)
  ((SELECT id FROM device_type_data WHERE name = 'DDR'), 1, 'available'),
  ((SELECT id FROM device_type_data WHERE name = 'DDR'), 2, 'in_use'),
  
  -- 태고의 달인 (2대)
  ((SELECT id FROM device_type_data WHERE name = '태고의 달인'), 1, 'available'),
  ((SELECT id FROM device_type_data WHERE name = '태고의 달인'), 2, 'available'),
  
  -- 철권 7 (4대)
  ((SELECT id FROM device_type_data WHERE name = '철권 7'), 1, 'available'),
  ((SELECT id FROM device_type_data WHERE name = '철권 7'), 2, 'available'),
  ((SELECT id FROM device_type_data WHERE name = '철권 7'), 3, 'broken'),
  ((SELECT id FROM device_type_data WHERE name = '철권 7'), 4, 'available')
ON CONFLICT (device_type_id, device_number) DO NOTHING;