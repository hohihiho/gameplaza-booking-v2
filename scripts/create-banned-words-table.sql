-- banned_words 테이블 생성
CREATE TABLE IF NOT EXISTS banned_words (
  id SERIAL PRIMARY KEY,
  word TEXT NOT NULL UNIQUE,
  severity INTEGER NOT NULL DEFAULT 1 CHECK (severity IN (1, 2)), -- 1: 경고, 2: 차단
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_banned_words_active ON banned_words(is_active);
CREATE INDEX idx_banned_words_word ON banned_words(word);

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_banned_words_updated_at BEFORE UPDATE
    ON banned_words FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 기본 금지어 추가 (비속어)
INSERT INTO banned_words (word, severity, category) VALUES
('시발', 2, 'profanity'),
('씨발', 2, 'profanity'),
('개새끼', 2, 'profanity'),
('병신', 2, 'profanity'),
('좆', 2, 'profanity'),
('지랄', 2, 'profanity'),
('니어미', 2, 'profanity'),
('섹스', 2, 'sexual'),
('야동', 2, 'sexual'),
('fuck', 2, 'profanity'),
('shit', 2, 'profanity'),
('bitch', 2, 'profanity'),
('asshole', 2, 'profanity'),
('dick', 2, 'profanity'),
('pussy', 2, 'sexual'),
('cock', 2, 'sexual'),
('whore', 2, 'profanity'),
('죽어', 2, 'offensive'),
('디져', 2, 'offensive'),
('꺼져', 2, 'offensive')
ON CONFLICT (word) DO NOTHING;