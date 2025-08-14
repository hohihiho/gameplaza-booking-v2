#!/bin/bash

# 개발 DB에서 운영 DB로 스키마 마이그레이션 스크립트
# 주의: 데이터는 마이그레이션하지 않고 스키마만 복사합니다

echo "🚀 개발 DB → 운영 DB 스키마 마이그레이션 시작"
echo "================================================"

# 환경 변수 체크
if [ -z "$DEV_DB_URL" ] || [ -z "$PROD_DB_URL" ]; then
    echo "❌ 환경 변수를 설정해주세요:"
    echo "export DEV_DB_URL='postgresql://postgres.rupeyejnfurlcpgneekg:password@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres'"
    echo "export PROD_DB_URL='postgresql://postgres.새프로젝트:password@host:port/postgres'"
    exit 1
fi

# 1. 개발 DB 스키마 덤프
echo "📦 개발 DB 스키마 내보내기..."
pg_dump "$DEV_DB_URL" \
    --schema-only \
    --no-owner \
    --no-privileges \
    --no-comments \
    --exclude-schema=supabase_functions \
    --exclude-schema=storage \
    --exclude-schema=vault \
    > schema_dump.sql

if [ $? -ne 0 ]; then
    echo "❌ 스키마 덤프 실패"
    exit 1
fi

echo "✅ 스키마 덤프 완료"

# 2. 운영 DB에 스키마 적용
echo "📝 운영 DB에 스키마 적용..."
psql "$PROD_DB_URL" < schema_dump.sql

if [ $? -ne 0 ]; then
    echo "⚠️  일부 오류가 발생했을 수 있습니다. 로그를 확인하세요."
else
    echo "✅ 스키마 적용 완료"
fi

# 3. 필수 초기 데이터만 삽입 (선택사항)
echo "📊 필수 초기 데이터 삽입..."
cat << EOF | psql "$PROD_DB_URL"
-- 기본 관리자 계정 (필요시)
-- INSERT INTO users (email, name, role) VALUES 
-- ('admin@gameplaza.kr', '관리자', 'admin');

-- 기본 기기 목록
INSERT INTO devices (name, type, status, position) VALUES
('PS5 #1', 'PS5', 'available', 1),
('PS5 #2', 'PS5', 'available', 2),
('PS5 #3', 'PS5', 'available', 3),
('PS5 #4', 'PS5', 'available', 4),
('Switch #1', 'SWITCH', 'available', 5),
('Switch #2', 'SWITCH', 'available', 6),
('Racing #1', 'RACING', 'available', 7),
('Racing #2', 'RACING', 'available', 8)
ON CONFLICT DO NOTHING;

-- 기본 설정값
INSERT INTO settings (key, value) VALUES
('reservation_limit', '2'),
('operation_hours', '{"open": "10:00", "close": "22:00"}'),
('max_duration', '4')
ON CONFLICT DO NOTHING;
EOF

echo "✅ 초기 데이터 삽입 완료"

# 4. 정리
rm schema_dump.sql
echo "🎉 마이그레이션 완료!"
echo ""
echo "⚠️  다음 단계:"
echo "1. Supabase Dashboard에서 RLS 정책 확인"
echo "2. Storage 버킷 설정 확인"
echo "3. Edge Functions 배포 (필요시)"
echo "4. 운영 환경에서 테스트"