-- 공지사항 테이블 생성
CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'general',
  is_important BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  published_at DATETIME,
  expires_at DATETIME,
  view_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

-- 공지사항 타입별 인덱스
CREATE INDEX IF NOT EXISTS idx_announcements_type ON announcements(type);

-- 발행 상태 및 중요도 복합 인덱스 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_announcements_published_important 
ON announcements(is_published, is_important, sort_order DESC, created_at DESC);

-- 만료일 인덱스 (자동 숨김 처리용)
CREATE INDEX IF NOT EXISTS idx_announcements_expires ON announcements(expires_at);

-- 기본 공지사항 데이터 삽입 (예시)
INSERT OR IGNORE INTO announcements (
  title, 
  content, 
  type, 
  is_important, 
  is_published, 
  created_by, 
  published_at
) VALUES 
(
  '광주 게임플라자에 오신 것을 환영합니다!',
  '저희 게임플라자에서는 다양한 리듬게임을 즐기실 수 있습니다.<br><br><strong>이용 시간:</strong><br>• 평일: 14:00 - 24:00<br>• 주말: 13:00 - 24:00<br><br><strong>예약 방법:</strong><br>• 24시간 전 예약 필수<br>• 관리자 승인 후 이용 가능<br><br>궁금한 사항은 언제든지 문의해 주세요!',
  'general',
  1,
  1,
  'admin@gameplaza.kr',
  datetime('now')
);

-- 트리거: updated_at 자동 업데이트
CREATE TRIGGER IF NOT EXISTS update_announcements_updated_at
AFTER UPDATE ON announcements
FOR EACH ROW
BEGIN
  UPDATE announcements SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;