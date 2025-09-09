-- 금지어 관리 테이블 추가
CREATE TABLE IF NOT EXISTS banned_words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'custom', -- 'system', 'custom', 'profanity', 'sexual', 'aggressive'
  reason TEXT, -- 금지 이유
  added_by TEXT, -- 추가한 관리자 ID
  is_active BOOLEAN NOT NULL DEFAULT 1, -- 활성화 여부
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_banned_words_word ON banned_words(word);
CREATE INDEX IF NOT EXISTS idx_banned_words_active ON banned_words(is_active);
CREATE INDEX IF NOT EXISTS idx_banned_words_category ON banned_words(category);

-- 기본 시스템 금지어 몇 개 추가
INSERT OR IGNORE INTO banned_words (word, category, reason, added_by) VALUES
('관리자', 'system', '시스템 예약어', 'system'),
('admin', 'system', '시스템 예약어', 'system'),
('운영자', 'system', '시스템 예약어', 'system'),
('게임플라자', 'system', '사이트명 보호', 'system');