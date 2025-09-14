-- Guide Contents 테이블 생성
CREATE TABLE IF NOT EXISTS guide_contents (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  category TEXT NOT NULL, -- 'arcade' 또는 'reservation'
  section TEXT NOT NULL, -- 'rules', 'broadcast', 'vending', 'card', 'reservation_rules' 등
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- JSON 형태의 배열로 저장 (불렛 포인트들)
  order_index INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  updated_by TEXT
);

-- 기본 데이터 삽입
INSERT INTO guide_contents (category, section, title, content, order_index) VALUES
-- 오락실 이용안내
('arcade', 'rules', '이용수칙', '["기기를 소중히 다뤄주세요","음료수는 지정된 장소에만 놓아주세요","큰 소리로 떠들지 말아주세요","다른 이용자를 배려해주세요","쓰레기는 쓰레기통에 버려주세요"]', 1),
('arcade', 'broadcast', '방송기기 이용안내', '["방송용 기기는 사전 예약 필수입니다","스트리밍 시 다른 이용자 촬영에 주의해주세요","방송 장비 대여 가능 (문의 필요)","소음 수준을 적절히 유지해주세요"]', 2),
('arcade', 'vending', '음료수 자판기 이용안내', '["자판기는 1층과 2층에 위치합니다","동전과 지폐 모두 사용 가능합니다","고장 시 카운터로 문의해주세요","뜨거운 음료 취급 시 주의하세요"]', 3),
('arcade', 'card', '선불카드 안내', '["카드 구매: 카운터에서 가능","충전: 1,000원 단위로 충전 가능","잔액 환불: 카운터에서 신청","카드 분실 시 재발급 불가","유효기간: 최종 사용일로부터 1년"]', 4),

-- 예약 이용안내
('reservation', 'rules', '예약 규정', '["예약은 최대 2주 전부터 가능합니다","당일 예약은 불가능합니다","1인당 주 3회까지 예약 가능","예약 시간 10분 경과 시 자동 취소됩니다"]', 1),
('reservation', 'timeslots', '예약 시간대', '["조기 예약: 오전 7시-12시","일반 예약: 오후 12시-10시","밤샘 예약: 오후 10시-익일 오전 5시","주말/공휴일은 예약 경쟁이 치열합니다"]', 2),
('reservation', 'cancel', '취소 규정', '["예약 24시간 전: 100% 환불","예약 12시간 전: 50% 환불","예약 12시간 이내: 환불 불가","노쇼 3회 시 1개월 예약 제한"]', 3),
('reservation', 'confirm', '예약 확정 조건', '["예약금 결제 완료 시 확정","카드 또는 계좌이체로 결제 가능","예약 확정 후 SMS 발송","체크인은 예약 시간 10분 전부터 가능"]', 4);

-- 인덱스 생성
CREATE INDEX idx_guide_contents_category ON guide_contents(category);
CREATE INDEX idx_guide_contents_section ON guide_contents(section);
CREATE INDEX idx_guide_contents_active ON guide_contents(is_active);