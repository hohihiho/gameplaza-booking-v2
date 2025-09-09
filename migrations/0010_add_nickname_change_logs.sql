-- 닉네임 변경 로그 테이블 추가
CREATE TABLE IF NOT EXISTS nickname_change_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  old_nickname TEXT NOT NULL,
  new_nickname TEXT NOT NULL,
  changed_by TEXT NOT NULL, -- 관리자 ID
  reason TEXT, -- 변경 이유
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_nickname_logs_user_id ON nickname_change_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_nickname_logs_changed_by ON nickname_change_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_nickname_logs_created_at ON nickname_change_logs(created_at);