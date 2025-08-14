#!/bin/bash

echo "🔄 개발 DB로 전환합니다..."

# .env.local 파일을 개발 DB 설정으로 업데이트
cat > .env.local << EOF
# Supabase 설정 (개발 DB)
NEXT_PUBLIC_SUPABASE_URL=https://rupeyejnfurlcpgneekg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1cGV5ZWpuZnVybGNwZ25lZWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjY0MjgsImV4cCI6MjA2NjQ0MjQyOH0.klSRGXI1hzkAG_mfORuAK5C74vDclX8VFeLEsyv9CAs

# 서버 전용 (절대 클라이언트에 노출하면 안됨!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1cGV5ZWpuZnVybGNwZ25lZWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDg2NjQyOCwiZXhwIjoyMDY2NDQyNDI4fQ.49VEsYv-jDnKPb1wK_wBmXgcdQWnYilLYaqbbaAHCt4

# Personal Access Token (MCP용)  
SUPABASE_ACCESS_TOKEN=sbp_d2b033997eb6381787c0460cf9e1a18d767897c0

# NextAuth 설정
NEXTAUTH_SECRET=s+buiCTuHYFj6iSQkRaY17VAOIvINq2gS6F1yIO+IxI=
NEXTAUTH_URL=http://localhost:3000

# 데이터베이스 직접 연결 (마이그레이션용)
DATABASE_URL=postgresql://postgres.rupeyejnfurlcpgneekg:tpgml12%40%40S@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres

# Google Maps API 키 (현재 비활성화 - API 키 재발급 필요)
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key-here

# NextAuth 설정
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=s3o1xAv6Tu7vtob+gt2vjv4pH9RFa/Qe5kBnlw4hBMk=

# Google OAuth (기존에 제공한 클라이언트 정보)
GOOGLE_CLIENT_ID=44559014883-248e8a3kb4meo4peee4ga8vr5190566m.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Firebase 설정 (전화번호 인증용)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCmUu1gBrvxAFfQbCwToKIraFgEdBGIt6o
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gameplaza-kr0.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://gameplaza-kr0-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gameplaza-kr0
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gameplaza-kr0.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=44559014883
NEXT_PUBLIC_FIREBASE_APP_ID=1:44559014883:web:edab1727ac2d7a965cded6
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-6WBCMK3RYF

# PWA Push Notifications - VAPID Keys
# 실제 프로덕션에서는 node scripts/generate-vapid-keys.js로 생성해야 합니다
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BKd0F7QbaOONvQ1Y7Tj5SGYP-7PY9jKXzSqPqPbPUzOhS7kcMdYCYKqWjRETeQc2TKZMSKqHYXBHpAV8QqnGXTg
VAPID_PRIVATE_KEY=4VQjhbsd_5vCCYHmvLqzVBLWPWH9wPaVU5UBpFPWV4A

# Vercel Cron Job Secret
CRON_SECRET=your-secure-cron-secret-here

# Development settings
NEXT_TELEMETRY_DISABLED=1

# 한국천문연구원 공휴일 API (공공데이터포털)
# 아래에 발급받은 일반 인증키(Encoding) 입력
NEXT_PUBLIC_HOLIDAY_API_KEY=jrAc%2BOqGGL6NGNpcrAqLHdcGwqQ6vVMxYmneaDm3ZWMMeUw0GqGYGRDXt%2F1NMMWCXDifelmWxSzYUvCHn0xFDg%3D%3D
EOF

echo "✅ 개발 DB로 전환 완료!"
echo "📍 현재 DB: gameplaza-dev (rupeyejnfurlcpgneekg.supabase.co)"
echo ""
echo "🔄 서버를 재시작하세요:"
echo "   npm run dev"