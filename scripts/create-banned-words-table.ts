import * as dotenv from 'dotenv';
// // import { createClient } from '@/lib/supabase-mock';

// 환경 변수 로드
dotenv.config({ path: '.env.local' });

// Supabase 클라이언트 생성
// import { supabase } from '@/lib/supabase-mock';
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createBannedWordsTable() {
  console.log('banned_words 테이블 생성 중...');
  
  // 테이블 생성 SQL
  const createTableSQL = `
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
    CREATE INDEX IF NOT EXISTS idx_banned_words_active ON banned_words(is_active);
    CREATE INDEX IF NOT EXISTS idx_banned_words_word ON banned_words(word);

    -- 업데이트 트리거
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    DROP TRIGGER IF EXISTS update_banned_words_updated_at ON banned_words;
    CREATE TRIGGER update_banned_words_updated_at BEFORE UPDATE
        ON banned_words FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `;

  try {
//     import { supabase } from '@/lib/supabase-mock';
  const { error$1 } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      // RPC가 없을 수 있으므로 직접 시도
      console.log('SQL 실행 중...');
      
      // 기본 비속어 추가
      const defaultBannedWords = [
        { word: '시발', severity: 2, category: 'profanity' },
        { word: '씨발', severity: 2, category: 'profanity' },
        { word: '개새끼', severity: 2, category: 'profanity' },
        { word: '병신', severity: 2, category: 'profanity' },
        { word: '좆', severity: 2, category: 'profanity' },
        { word: '지랄', severity: 2, category: 'profanity' },
        { word: '니어미', severity: 2, category: 'profanity' },
        { word: '섹스', severity: 2, category: 'sexual' },
        { word: '야동', severity: 2, category: 'sexual' },
        { word: 'fuck', severity: 2, category: 'profanity' },
        { word: 'shit', severity: 2, category: 'profanity' },
        { word: 'bitch', severity: 2, category: 'profanity' },
        { word: 'asshole', severity: 2, category: 'profanity' },
        { word: 'dick', severity: 2, category: 'profanity' },
        { word: 'pussy', severity: 2, category: 'sexual' },
        { word: 'cock', severity: 2, category: 'sexual' },
        { word: 'whore', severity: 2, category: 'profanity' },
        { word: '죽어', severity: 2, category: 'offensive' },
        { word: '디져', severity: 2, category: 'offensive' },
        { word: '꺼져', severity: 2, category: 'offensive' }
      ];
      
      console.log('기본 금지어 추가 중...');
      for (const word of defaultBannedWords) {
//         import { supabase } from '@/lib/supabase-mock';
  const { error$1 } = await supabase.from('banned_words')
          .insert(word);
        
        if (insertError) {
          console.log(`⚠️  ${word.word} 추가 실패:`, insertError.message);
        } else {
          console.log(`✅ ${word.word} 추가됨`);
        }
      }
    } else {
      console.log('✅ 테이블 생성 완료!');
    }
    
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

// 스크립트 실행
createBannedWordsTable().catch(console.error);