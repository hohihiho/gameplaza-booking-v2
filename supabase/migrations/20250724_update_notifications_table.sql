-- 알림 테이블 스키마 업데이트
-- NotificationSupabaseRepository와 일치하도록 컬럼 추가 및 수정

-- 기존 notifications 테이블 수정
ALTER TABLE notifications 
  -- message 컬럼을 body로 변경
  RENAME COLUMN message TO body;

-- 새로운 컬럼들 추가
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS channels JSONB DEFAULT '["in_app"]'::jsonb,
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS failed_channels JSONB,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 기존 데이터에 대한 기본값 설정
UPDATE notifications 
SET 
  channels = '["in_app"]'::jsonb,
  priority = 'medium',
  created_at = COALESCE(created_at, sent_at, NOW()),
  updated_at = COALESCE(updated_at, sent_at, NOW())
WHERE channels IS NULL OR priority IS NULL OR created_at IS NULL OR updated_at IS NULL;

-- updated_at 자동 업데이트 트리거 추가
DROP TRIGGER IF EXISTS trigger_notifications_updated_at ON notifications;
CREATE TRIGGER trigger_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 인덱스 업데이트
DROP INDEX IF EXISTS idx_notifications_user_unread;
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL AND sent_at IS NULL;
CREATE INDEX idx_notifications_priority ON notifications(priority, created_at);

-- 정책 업데이트 (RLS)
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON notifications 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 알림에 접근 가능
CREATE POLICY "Admins can manage all notifications" ON notifications 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins a 
      JOIN users u ON a.user_id = u.id 
      WHERE u.id = auth.uid()
    )
  );

COMMENT ON TABLE notifications IS '사용자 알림 테이블';
COMMENT ON COLUMN notifications.channels IS '알림 채널: push, email, sms, in_app';
COMMENT ON COLUMN notifications.priority IS '알림 우선순위: low, medium, high, urgent';
COMMENT ON COLUMN notifications.scheduled_for IS '예약 발송 시간';
COMMENT ON COLUMN notifications.failed_channels IS '발송 실패한 채널들';