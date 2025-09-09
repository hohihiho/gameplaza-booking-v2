-- 가이드 페이지 콘텐츠 저장용 테이블
CREATE TABLE IF NOT EXISTS guide_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_slug TEXT NOT NULL UNIQUE, -- 'guide' or 'guide/reservation'
    content JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 설정
ALTER TABLE guide_content ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있음
CREATE POLICY "guide_content_select" ON guide_content
    FOR SELECT USING (true);

-- 관리자만 수정 가능
CREATE POLICY "guide_content_update" ON guide_content
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.role = 'admin'
        )
    );

CREATE POLICY "guide_content_insert" ON guide_content
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.role = 'admin'
        )
    );

-- 기본 데이터 삽입
INSERT INTO guide_content (page_slug, content) VALUES
    ('guide', '{
        "hours": "오전 10:00 - 익일 오전 2:00 (연중무휴)",
        "address": "광주광역시 서구 게임로 123",
        "phone": "062-123-4567 (카카오톡 채널 우선)",
        "prices": {
            "rhythm": "500원/1곡, 1,000원/3곡",
            "arcade": "500원~1,000원/1플레이",
            "fighting": "500원/1판",
            "rental_early": "30,000원~",
            "rental_normal": "40,000원~",
            "rental_overnight": "60,000원~"
        },
        "facilities": {
            "rhythm": ["유비트, 사운드 볼텍스, 팝픈뮤직", "댄스댄스레볼루션, 펌프잇업", "마이마이, 츄니즘, 왓카 등"],
            "arcade": ["슈팅게임, 퍼즐게임", "대전격투게임", "레트로 게임기"],
            "amenities": ["무료 WiFi", "충전 스테이션", "음료 자판기", "휴게 공간", "짐 보관함", "흡연구역"]
        },
        "rules": {
            "basic": ["큰 소리로 떠들거나 욕설 금지", "다른 이용자에게 피해 주지 않기", "기기 파손 시 배상 책임"],
            "prohibited": ["음주 후 이용 금지", "흡연 금지 (흡연구역 이용)", "음식물 반입 금지 (음료는 가능)", "기기 임의 조작 금지"],
            "safety": ["젖은 손으로 기기 조작 금지", "과도한 힘 사용 금지", "어린이는 보호자 동반 필수"]
        },
        "services": [
            {"icon": "Users", "title": "초보자 가이드", "description": "처음 오신 분들을 위한 게임 설명"},
            {"icon": "Calendar", "title": "이벤트", "description": "월별 토너먼트, 스코어 챌린지"},
            {"icon": "CreditCard", "title": "멤버십", "description": "단골 고객 할인 혜택"},
            {"icon": "Gift", "title": "생일 할인", "description": "생일 당일 20% 할인"}
        ]
    }'),
    ('guide/reservation', '{
        "timeSlots": [
            {"name": "조기영업", "time": "07:00~12:00 (5시간)"},
            {"name": "주간영업", "time": "12:00~18:00 (6시간)"},
            {"name": "야간영업", "time": "18:00~24:00 (6시간)"},
            {"name": "밤샘영업", "time": "24:00~07:00 (7시간)"}
        ],
        "reservationSteps": [
            {
                "title": "회원가입",
                "details": ["구글 계정으로 간편 로그인", "전화번호 인증 (SMS)", "닉네임 설정"]
            },
            {
                "title": "예약 신청",
                "details": ["원하는 날짜 선택", "원하는 기기 종류 선택 (마이마이, 츄니즘, 발키리, 라이트닝)", "예약 가능 시간대 확인", "원하는 시간대와 대수 선택", "옵션 선택 (마이마이 2P: +10,000원)", "예약 신청 완료"]
            },
            {
                "title": "예약 확인",
                "details": ["관리자 승인 대기 (평균 30분 이내)", "승인/거절 시 즉시 알림", "마이페이지에서 예약 상태 확인"]
            }
        ],
        "cancellationPolicy": [
            {"icon": "CheckCircle", "title": "이용 24시간 전", "description": "무료 취소 가능", "type": "success"},
            {"icon": "AlertCircle", "title": "이용 24시간~6시간 전", "description": "50% 취소 수수료", "type": "warning"},
            {"icon": "XCircle", "title": "이용 6시간 이내", "description": "취소 불가", "type": "error"}
        ],
        "penalties": ["노쇼 2회: 1개월 예약 제한", "노쇼 3회: 블랙리스트 등록", "악의적 이용: 영구 이용 제한"],
        "checkIn": {
            "steps": ["예약 시간 10분 전부터 체크인 가능", "카운터에서 예약 확인", "기기 번호 배정", "결제 진행"],
            "payment": [
                {"method": "현금 결제", "description": "카운터에서 직접 결제"},
                {"method": "계좌이체", "steps": ["체크인 시 계좌정보 알림 수신", "알림 클릭하여 계좌번호 복사", "이체 완료 후 확인"]}
            ]
        },
        "faqs": [
            {"question": "예약 없이도 이용 가능한가요?", "answer": "네, 가능합니다. 예약은 대여 시에만 필요하며, 일반 이용은 자유롭게 가능합니다."},
            {"question": "친구와 함께 예약하고 싶어요.", "answer": "각자 개별 예약을 하시되, 메모란에 함께 이용 희망을 적어주세요. 관리자가 확인 후 최대한 인접한 기기로 배정해드립니다."},
            {"question": "예약 승인은 얼마나 걸리나요?", "answer": "보통 30분 이내 처리되며, 영업시간 외 신청은 다음 영업일에 처리됩니다."},
            {"question": "기기가 고장나면 어떻게 하나요?", "answer": "즉시 직원에게 알려주시면 다른 기기로 변경해드립니다. 이용 시간은 보장됩니다."},
            {"question": "예약 시간을 연장할 수 있나요?", "answer": "다음 예약이 없는 경우에만 현장에서 연장 가능합니다. 추가 요금이 발생합니다."}
        ]
    }')
ON CONFLICT (page_slug) DO NOTHING;