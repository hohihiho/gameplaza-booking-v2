-- 추가 한국어 비속어 및 금지어 목록
-- 이 목록은 선택적으로 추가할 수 있습니다

-- 한국어 욕설 변형
INSERT INTO banned_words (word, category, language, severity) VALUES
  -- ㅅㅂ 변형
  ('ㅅㅂ', 'profanity', 'ko', 2),
  ('ㅆㅂ', 'profanity', 'ko', 2),
  ('시바', 'profanity', 'ko', 2),
  ('씨바', 'profanity', 'ko', 2),
  ('시팔', 'profanity', 'ko', 2),
  ('씨팔', 'profanity', 'ko', 2),
  ('십알', 'profanity', 'ko', 2),
  ('씹알', 'profanity', 'ko', 2),
  ('시벌', 'profanity', 'ko', 2),
  ('씨벌', 'profanity', 'ko', 2),
  ('시불', 'profanity', 'ko', 2),
  ('씨불', 'profanity', 'ko', 2),
  ('시붕', 'profanity', 'ko', 2),
  ('씨붕', 'profanity', 'ko', 2),
  
  -- ㄱㅅㄲ 변형
  ('ㄱㅅㄲ', 'profanity', 'ko', 2),
  ('개색', 'profanity', 'ko', 2),
  ('개샊', 'profanity', 'ko', 2),
  ('개세', 'profanity', 'ko', 2),
  ('개새', 'profanity', 'ko', 2),
  ('개쉐', 'profanity', 'ko', 2),
  ('개쉑', 'profanity', 'ko', 2),
  ('개섀', 'profanity', 'ko', 2),
  
  -- ㅂㅅ 변형
  ('ㅂㅅ', 'profanity', 'ko', 2),
  ('ㅂㅆ', 'profanity', 'ko', 2),
  ('병쉰', 'profanity', 'ko', 2),
  ('병싄', 'profanity', 'ko', 2),
  ('뵹신', 'profanity', 'ko', 2),
  ('뵹싄', 'profanity', 'ko', 2),
  
  -- ㅈㄹ 변형
  ('ㅈㄹ', 'profanity', 'ko', 2),
  ('지럴', 'profanity', 'ko', 2),
  ('즤랄', 'profanity', 'ko', 2),
  ('즈랄', 'profanity', 'ko', 2),
  ('지롤', 'profanity', 'ko', 2),
  
  -- 기타 욕설
  ('ㅅㄲ', 'profanity', 'ko', 2),
  ('ㅆㄲ', 'profanity', 'ko', 2),
  ('새기', 'profanity', 'ko', 2),
  ('섀기', 'profanity', 'ko', 2),
  ('쉐기', 'profanity', 'ko', 2),
  ('쉑이', 'profanity', 'ko', 2),
  ('색희', 'profanity', 'ko', 2),
  ('색히', 'profanity', 'ko', 2),
  
  -- 공격적 표현
  ('느금마', 'offensive', 'ko', 2),
  ('느그매', 'offensive', 'ko', 2),
  ('니애미', 'offensive', 'ko', 2),
  ('니애비', 'offensive', 'ko', 2),
  ('니미', 'offensive', 'ko', 2),
  ('니비', 'offensive', 'ko', 2),
  ('뒤져', 'offensive', 'ko', 2),
  ('뒈져', 'offensive', 'ko', 2),
  ('디져', 'offensive', 'ko', 2),
  ('죽여', 'offensive', 'ko', 2),
  ('죽일', 'offensive', 'ko', 2),
  
  -- 차별적 표현
  ('틀딱', 'offensive', 'ko', 2),
  ('급식', 'offensive', 'ko', 1),
  ('한남', 'offensive', 'ko', 2),
  ('한녀', 'offensive', 'ko', 2),
  ('페미', 'offensive', 'ko', 1),
  ('일베', 'offensive', 'ko', 2),
  ('메갈', 'offensive', 'ko', 2),
  ('똥남아', 'offensive', 'ko', 2),
  ('보슬아치', 'offensive', 'ko', 2),
  ('자지', 'offensive', 'ko', 2),
  ('보지', 'offensive', 'ko', 2),
  
  -- 영어 욕설 변형
  ('fk', 'profanity', 'en', 2),
  ('fuk', 'profanity', 'en', 2),
  ('fuc', 'profanity', 'en', 2),
  ('fuq', 'profanity', 'en', 2),
  ('fvck', 'profanity', 'en', 2),
  ('fcuk', 'profanity', 'en', 2),
  ('sht', 'profanity', 'en', 2),
  ('sh1t', 'profanity', 'en', 2),
  ('shyt', 'profanity', 'en', 2),
  ('btch', 'profanity', 'en', 2),
  ('b1tch', 'profanity', 'en', 2),
  ('beotch', 'profanity', 'en', 2),
  ('a$$', 'profanity', 'en', 2),
  ('azz', 'profanity', 'en', 2),
  ('dik', 'profanity', 'en', 2),
  ('d1ck', 'profanity', 'en', 2),
  ('cok', 'profanity', 'en', 2),
  ('c0ck', 'profanity', 'en', 2),
  
  -- 스팸/광고 관련
  ('카톡', 'custom', 'ko', 1),
  ('라인', 'custom', 'ko', 1),
  ('텔레그램', 'custom', 'ko', 1),
  ('오픈채팅', 'custom', 'ko', 1),
  ('오픈톡', 'custom', 'ko', 1),
  ('단톡', 'custom', 'ko', 1),
  ('바로가기', 'custom', 'ko', 1),
  ('클릭', 'custom', 'ko', 1),
  ('링크', 'custom', 'ko', 1),
  ('주소', 'custom', 'ko', 1),
  ('도메인', 'custom', 'ko', 1),
  ('.com', 'custom', 'all', 1),
  ('.net', 'custom', 'all', 1),
  ('.kr', 'custom', 'all', 1),
  ('http', 'custom', 'all', 1),
  ('www', 'custom', 'all', 1)
ON CONFLICT (word) DO NOTHING;