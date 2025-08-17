-- 푸시 알림 관련 테이블 생성 스크립트
-- 비전공자 설명: 푸시 알림 구독 정보와 발송 기록을 저장하는 테이블들입니다

-- 1. 푸시 구독 정보 테이블
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- 사용자 정보
    user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    
    -- 푸시 구독 정보 (Service Worker에서 생성)
    endpoint TEXT NOT NULL,
    p256dh TEXT,
    auth TEXT,
    
    -- 기기 정보
    user_agent TEXT,
    
    -- 구독 상태
    enabled BOOLEAN DEFAULT true NOT NULL,
    
    -- 유니크 제약: 같은 endpoint는 하나만 존재
    UNIQUE(endpoint)
);

-- 2. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_email ON push_subscriptions(user_email);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_enabled ON push_subscriptions(enabled);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_created_at ON push_subscriptions(created_at);

-- 3. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER push_subscriptions_updated_at
    BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_push_subscriptions_updated_at();

-- 4. Row Level Security (RLS) 설정
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 구독 정보만 볼 수 있음
CREATE POLICY "Users can view own push subscriptions" ON push_subscriptions
    FOR SELECT USING (user_email = auth.jwt()->>'email');

-- 사용자는 자신의 구독 정보만 생성/업데이트할 수 있음
CREATE POLICY "Users can manage own push subscriptions" ON push_subscriptions
    FOR ALL USING (user_email = auth.jwt()->>'email');

-- 관리자는 모든 구독 정보에 접근 가능
CREATE POLICY "Admins can manage all push subscriptions" ON push_subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE user_id = (
                SELECT id FROM users 
                WHERE email = auth.jwt()->>'email'
            )
        )
    );

-- 5. 푸시 알림 발송 기록 테이블 (선택사항 - 발송 로그를 남기고 싶다면)
CREATE TABLE IF NOT EXISTS push_notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- 발송 정보
    target_email TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    
    -- 발송 결과
    success_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    
    -- 발송 세부 정보 (JSON)
    details JSONB,
    
    -- 발송자 정보 (관리자가 발송한 경우)
    sender_email TEXT,
    
    -- 알림 타입 (예: 'test', 'reservation', 'event', 'system')
    notification_type TEXT DEFAULT 'manual'
);

-- 6. 로그 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_push_logs_target_email ON push_notification_logs(target_email);
CREATE INDEX IF NOT EXISTS idx_push_logs_created_at ON push_notification_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_push_logs_type ON push_notification_logs(notification_type);

-- 7. users 테이블에 푸시 알림 설정 컬럼 추가 (없다면)
DO $$ 
BEGIN
    -- push_notifications_enabled 컬럼이 없다면 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'push_notifications_enabled') THEN
        ALTER TABLE users ADD COLUMN push_notifications_enabled BOOLEAN DEFAULT false;
    END IF;
    
    -- marketing_agreed 컬럼이 없다면 추가 (이미 있을 수 있음)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'marketing_agreed') THEN
        ALTER TABLE users ADD COLUMN marketing_agreed BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 8. 테스트 데이터 확인 쿼리
-- SELECT 
--     p.user_email,
--     p.enabled,
--     p.created_at,
--     u.push_notifications_enabled,
--     u.marketing_agreed
-- FROM push_subscriptions p
-- JOIN users u ON u.email = p.user_email
-- ORDER BY p.created_at DESC;

COMMENT ON TABLE push_subscriptions IS '사용자별 푸시 알림 구독 정보를 저장하는 테이블';
COMMENT ON TABLE push_notification_logs IS '푸시 알림 발송 기록을 저장하는 테이블';

-- 스크립트 실행 완료 알림
SELECT 'Push notification tables created successfully!' AS status;