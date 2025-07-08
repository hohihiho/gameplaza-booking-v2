-- 금지어 관리 테이블
CREATE TABLE IF NOT EXISTS banned_words (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL UNIQUE,
  category TEXT DEFAULT 'custom', -- 'custom', 'profanity', 'offensive'
  language TEXT DEFAULT 'ko', -- 'ko', 'en', 'all'
  severity INTEGER DEFAULT 1, -- 1: 경고, 2: 차단
  added_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_banned_words_word ON banned_words(word);
CREATE INDEX idx_banned_words_active ON banned_words(is_active);

-- RLS 활성화
ALTER TABLE banned_words ENABLE ROW LEVEL SECURITY;

-- 정책: 모든 사용자가 활성화된 금지어를 볼 수 있음
CREATE POLICY "Anyone can view active banned words" ON banned_words
  FOR SELECT
  USING (is_active = true);

-- 정책: 관리자만 수정 가능
CREATE POLICY "Admins can manage banned words" ON banned_words
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id::text = auth.uid()::text
    )
  );

-- 기본 금지어 추가 (한국어 비속어)
INSERT INTO banned_words (word, category, language, severity) VALUES
  ('시발', 'profanity', 'ko', 2),
  ('씨발', 'profanity', 'ko', 2),
  ('개새끼', 'profanity', 'ko', 2),
  ('병신', 'profanity', 'ko', 2),
  ('지랄', 'profanity', 'ko', 2),
  ('좆', 'profanity', 'ko', 2),
  ('섹스', 'offensive', 'ko', 1),
  ('야동', 'offensive', 'ko', 1)
ON CONFLICT (word) DO NOTHING;

-- 기본 금지어 추가 (영어 비속어)
INSERT INTO banned_words (word, category, language, severity) VALUES
  ('fuck', 'profanity', 'en', 2),
  ('shit', 'profanity', 'en', 2),
  ('bitch', 'profanity', 'en', 2),
  ('ass', 'profanity', 'en', 1),
  ('dick', 'profanity', 'en', 2),
  ('pussy', 'profanity', 'en', 2),
  ('cock', 'profanity', 'en', 2),
  ('damn', 'profanity', 'en', 1)
ON CONFLICT (word) DO NOTHING;