# 데이터베이스 환경 가이드

## 📋 환경별 DB 사용 규칙

| 환경 | 사용 DB | 프로젝트 ID | 설명 |
|------|---------|------------|------|
| **로컬 개발** | 개발 DB | rupeyejnfurlcpgneekg | 로컬에서 개발 시 사용 |
| **Vercel 프리뷰** | 개발 DB | rupeyejnfurlcpgneekg | PR 및 프리뷰 배포 시 사용 |
| **Vercel 프로덕션** | 운영 DB | rfcxbqlgvppqjxgpwnzd | 실제 서비스 운영 시 사용 |

## 🛡️ 안전 장치

### 1. 자동 환경 체크
- `next.config.js`에서 자동으로 DB 환경을 확인
- 로컬에서 프로덕션 DB 사용 시 **즉시 차단**
- 잘못된 환경 설정 시 경고 메시지 표시

### 2. DB 전환 스크립트
```bash
# 개발 DB로 전환 (로컬 개발 시)
./scripts/use-dev-db.sh

# 프로덕션 DB로 전환 (운영 점검 시에만)
./scripts/use-prod-db.sh
```

## ⚠️ 주의사항

### 로컬 개발 시
1. **절대 프로덕션 DB를 사용하지 마세요**
   - 실수로 운영 데이터를 변경할 수 있습니다
   - 자동 차단 기능이 작동합니다

2. **개발 DB 사용 확인**
   ```bash
   # 서버 시작 시 다음 메시지 확인
   🟢 개발 DB 사용 중 (rupeyejnfurlcpgneekg)
      안전: 개발 데이터입니다.
   ```

### Vercel 배포 시
1. **환경 변수는 Vercel 대시보드에서 설정**
   - 프로덕션: 운영 DB 환경변수
   - 프리뷰: 개발 DB 환경변수

2. **자동 환경 감지**
   - `VERCEL_ENV` 변수로 자동 구분
   - production: 운영 DB
   - preview/development: 개발 DB

## 🔧 문제 해결

### 로컬에서 프로덕션 DB 차단 시
```bash
# 다음 명령어 실행
./scripts/use-dev-db.sh

# 서버 재시작
npm run dev
```

### DB 연결 확인
```bash
# 현재 연결된 DB 확인
grep SUPABASE_URL .env.local

# 개발 DB이면
# rupeyejnfurlcpgneekg.supabase.co

# 프로덕션 DB이면 (로컬에서는 사용 금지!)
# rfcxbqlgvppqjxgpwnzd.supabase.co
```

## 📝 환경 변수 파일

### .env.local (로컬 개발)
- 기본적으로 개발 DB 설정 사용
- `use-dev-db.sh` 스크립트로 자동 설정

### .env.development.local (개발 환경 백업)
- 개발 DB 설정 백업
- .env.local이 없을 때 참조

### .env.production.local (프로덕션 참조용)
- 프로덕션 DB 설정 참조
- Vercel에서는 대시보드 환경변수 사용

## 🚨 긴급 상황

운영 DB 점검이 필요한 경우:
1. 팀 리더 승인 필요
2. 백업 후 작업
3. 작업 완료 후 즉시 개발 DB로 복원
```bash
# 긴급 운영 DB 접근 (주의!)
./scripts/use-prod-db.sh

# 작업 완료 후 반드시 실행
./scripts/use-dev-db.sh
```