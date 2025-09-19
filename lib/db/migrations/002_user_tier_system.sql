-- 002_user_tier_system.sql
-- 사용자 직급 시스템 테이블 생성
-- 작성일: 2025-01-17
-- 설명: 포인트 적립, 사용자 직급, 월별 순위 시스템을 위한 테이블들

-- ================================================
-- 1. user_points 테이블 - 사용자 포인트 적립 내역
-- ================================================

CREATE TABLE user_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    payment_transaction_id INTEGER,

    -- 포인트 정보
    points_earned INTEGER NOT NULL,  -- 적립된 포인트 (결제금액의 1%)
    payment_amount INTEGER NOT NULL, -- 기준이 된 결제 금액

    -- 월별 정산 정보
    month_year TEXT NOT NULL,        -- 'YYYY-MM' 형식
    earned_at TEXT NOT NULL,         -- KST DATETIME

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE,
    FOREIGN KEY (payment_transaction_id) REFERENCES payment_transactions (id) ON DELETE SET NULL
);

-- user_points 인덱스
CREATE INDEX idx_user_points_user_id ON user_points (user_id);
CREATE INDEX idx_user_points_month_year ON user_points (month_year);
CREATE INDEX idx_user_points_earned_at ON user_points (earned_at);
CREATE INDEX idx_user_points_user_month ON user_points (user_id, month_year);

-- ================================================
-- 2. user_tiers 테이블 - 사용자 직급 정보
-- ================================================

CREATE TABLE user_tiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,

    -- 현재 직급 정보
    current_tier TEXT NOT NULL DEFAULT 'no_tier' CHECK (current_tier IN ('gampl_king', 'gampl_vip', 'gampl_regular', 'gampl_user', 'no_tier')),
    current_points INTEGER NOT NULL DEFAULT 0,
    current_rank INTEGER,               -- 전체 순위 (null이면 순위 없음)

    -- 월별 정산 정보
    month_year TEXT NOT NULL,           -- 'YYYY-MM' 형식
    calculated_at TEXT NOT NULL,        -- KST DATETIME (월별 정산 실행 시각)

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE
);

-- user_tiers 인덱스
CREATE INDEX idx_user_tiers_user_id ON user_tiers (user_id);
CREATE INDEX idx_user_tiers_month_year ON user_tiers (month_year);
CREATE INDEX idx_user_tiers_tier ON user_tiers (current_tier);
CREATE INDEX idx_user_tiers_rank ON user_tiers (current_rank);
CREATE UNIQUE INDEX idx_user_tiers_user_month_unique ON user_tiers (user_id, month_year);

-- ================================================
-- 3. monthly_rankings 테이블 - 월별 순위 히스토리
-- ================================================

CREATE TABLE monthly_rankings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,

    -- 월별 성과 정보
    month_year TEXT NOT NULL,           -- 'YYYY-MM' 형식
    final_points INTEGER NOT NULL,      -- 해당 월 최종 포인트
    final_rank INTEGER NOT NULL,        -- 해당 월 최종 순위
    achieved_tier TEXT NOT NULL CHECK (achieved_tier IN ('gampl_king', 'gampl_vip', 'gampl_regular', 'gampl_user', 'no_tier')),

    -- 통계 정보
    total_transactions INTEGER NOT NULL DEFAULT 0,  -- 해당 월 거래 횟수
    total_spent INTEGER NOT NULL DEFAULT 0,         -- 해당 월 총 결제액

    -- 기록 시간
    settlement_date TEXT NOT NULL,      -- KST DATETIME (정산 완료 시각)

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE
);

-- monthly_rankings 인덱스
CREATE INDEX idx_monthly_rankings_user_id ON monthly_rankings (user_id);
CREATE INDEX idx_monthly_rankings_month_year ON monthly_rankings (month_year);
CREATE INDEX idx_monthly_rankings_rank ON monthly_rankings (final_rank);
CREATE INDEX idx_monthly_rankings_tier ON monthly_rankings (achieved_tier);
CREATE UNIQUE INDEX idx_monthly_rankings_user_month_unique ON monthly_rankings (user_id, month_year);

-- ================================================
-- 4. user_tier_current 테이블 - 현재 활성 사용자 직급 정보 (빠른 조회용)
-- ================================================

CREATE TABLE user_tier_current (
    user_id TEXT PRIMARY KEY,

    -- 현재 상태
    current_tier TEXT NOT NULL DEFAULT 'no_tier' CHECK (current_tier IN ('gampl_king', 'gampl_vip', 'gampl_regular', 'gampl_user', 'no_tier')),
    current_points INTEGER NOT NULL DEFAULT 0,
    current_rank INTEGER,               -- 현재 전체 순위

    -- 이번 달 정보
    current_month TEXT NOT NULL,        -- 'YYYY-MM' 형식

    -- 최고 기록
    best_tier TEXT DEFAULT 'no_tier' CHECK (best_tier IN ('gampl_king', 'gampl_vip', 'gampl_regular', 'gampl_user', 'no_tier')),
    best_rank INTEGER,                  -- 역대 최고 순위
    best_points INTEGER DEFAULT 0,     -- 역대 최고 포인트

    last_updated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE
);

-- user_tier_current 인덱스
CREATE INDEX idx_user_tier_current_tier ON user_tier_current (current_tier);
CREATE INDEX idx_user_tier_current_rank ON user_tier_current (current_rank);
CREATE INDEX idx_user_tier_current_points ON user_tier_current (current_points);

-- ================================================
-- 5. 트리거 설정 - 자동 업데이트
-- ================================================

-- user_tiers updated_at 자동 업데이트
CREATE TRIGGER tr_user_tiers_updated_at
AFTER UPDATE ON user_tiers
FOR EACH ROW
BEGIN
    UPDATE user_tiers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- user_tier_current last_updated 자동 업데이트
CREATE TRIGGER tr_user_tier_current_updated
AFTER UPDATE ON user_tier_current
FOR EACH ROW
BEGIN
    UPDATE user_tier_current SET last_updated = CURRENT_TIMESTAMP WHERE user_id = NEW.user_id;
END;