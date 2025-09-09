-- Migration: Add notices table for notice board system
-- Created: 2025-09-07

CREATE TABLE IF NOT EXISTS notices (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'event', 'maintenance', 'update')),
    is_pinned INTEGER NOT NULL DEFAULT 0 CHECK (is_pinned IN (0, 1)),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    view_count INTEGER NOT NULL DEFAULT 0,
    start_date INTEGER,
    end_date INTEGER,
    created_by TEXT NOT NULL REFERENCES users(id),
    updated_by TEXT REFERENCES users(id),
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notices_category ON notices(category);
CREATE INDEX IF NOT EXISTS idx_notices_active ON notices(is_active);
CREATE INDEX IF NOT EXISTS idx_notices_pinned ON notices(is_pinned);
CREATE INDEX IF NOT EXISTS idx_notices_date_range ON notices(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_notices_created_at ON notices(created_at);
CREATE INDEX IF NOT EXISTS idx_notices_view_count ON notices(view_count);

-- Insert some sample notices
INSERT INTO notices (title, content, category, is_pinned, created_by) VALUES
('게임플라자 오픈 기념 이벤트', '게임플라자 오픈을 기념하여 첫 예약 시 할인 이벤트를 진행합니다!', 'event', 1, 
 (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
('시설 이용 안내', '시설 이용 시 준수사항과 예약 방법에 대한 안내입니다.', 'general', 0, 
 (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
('정기 점검 안내', '매주 월요일 오전 9시-10시는 정기 점검 시간입니다.', 'maintenance', 0, 
 (SELECT id FROM users WHERE role = 'admin' LIMIT 1));