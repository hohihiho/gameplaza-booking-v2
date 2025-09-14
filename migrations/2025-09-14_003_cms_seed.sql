-- Seed guide categories for CMS (id auto-increment)
INSERT OR IGNORE INTO guide_categories (slug, name, description, display_order, created_at, updated_at) VALUES
  ('arcade', '오락실 이용 안내', '오락실 시설 및 이용 가이드', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('reservation', '예약 이용 안내', '대여/예약 관련 가이드', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('general', '일반 안내', '공지/기타 안내', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

