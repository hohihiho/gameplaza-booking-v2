# 📚 게임플라자 인시던트 대응 플레이북

## 🚨 긴급 연락처

| 역할 | 담당자 | 연락처 | 백업 담당자 |
|------|--------|--------|------------|
| 기술 리드 | - | - | - |
| DevOps | - | - | - |
| 백엔드 개발 | - | - | - |
| 프론트엔드 개발 | - | - | - |
| Supabase 지원 | - | support@supabase.io | - |
| Vercel 지원 | - | support@vercel.com | - |

## 🎯 인시던트 심각도 레벨

### 🔴 P1 - Critical (즉시 대응)
- **정의**: 전체 서비스 중단 또는 데이터 손실
- **대응 시간**: 15분 이내
- **예시**:
  - 사이트 전체 접속 불가
  - 데이터베이스 장애
  - 모든 예약 기능 중단
  - 보안 침해 발생

### 🟠 P2 - High (1시간 내 대응)
- **정의**: 주요 기능 장애 또는 성능 심각 저하
- **대응 시간**: 1시간 이내
- **예시**:
  - 예약 생성 불가
  - 로그인 기능 장애
  - 응답 시간 5초 초과
  - 에러율 10% 초과

### 🟡 P3 - Medium (4시간 내 대응)
- **정의**: 일부 기능 장애 또는 성능 저하
- **대응 시간**: 4시간 이내
- **예시**:
  - 특정 기기 예약 불가
  - 관리자 기능 일부 장애
  - 응답 시간 3초 초과
  - 에러율 5% 초과

### 🟢 P4 - Low (24시간 내 대응)
- **정의**: 사소한 버그 또는 개선 사항
- **대응 시간**: 24시간 이내
- **예시**:
  - UI 표시 오류
  - 비핵심 기능 오류
  - 성능 최적화 필요

## 📋 인시던트 대응 프로세스

### 1️⃣ 탐지 (Detection)

#### 자동 탐지
```bash
# 모니터링 대시보드 확인
- Vercel Analytics: https://vercel.com/dashboard
- Supabase Dashboard: https://app.supabase.com
- GitHub Actions: https://github.com/[org]/[repo]/actions
```

#### 알림 채널
- Slack: #gameplaza-alerts
- Email: alerts@gameplaza.com
- SMS: 긴급 담당자

### 2️⃣ 분류 (Triage)

#### 초기 평가 체크리스트
```markdown
[ ] 영향 범위 확인 (전체/일부/특정 사용자)
[ ] 심각도 레벨 결정 (P1-P4)
[ ] 근본 원인 추정
[ ] 임시 조치 가능 여부 확인
[ ] 관련 팀원 소집 필요성 판단
```

#### 상태 확인 명령어
```bash
# API 상태 확인
curl https://gameplaza.vercel.app/api/v2/health

# 데이터베이스 상태
curl https://gameplaza.vercel.app/api/v2/health/db

# 의존성 상태
curl https://gameplaza.vercel.app/api/v2/health/dependencies

# 메트릭 확인
curl https://gameplaza.vercel.app/api/v2/metrics
```

### 3️⃣ 대응 (Response)

#### P1 - Critical 대응

##### 1. 즉시 조치
```bash
# 1. 상태 페이지 업데이트
echo "서비스 장애 발생 - 확인 중" > /tmp/status.txt

# 2. 긴급 롤백 (필요시)
./scripts/canary-deploy.ts rollback

# 3. 트래픽 차단 (심각한 경우)
vercel env pull
echo "MAINTENANCE_MODE=true" >> .env
vercel env push
```

##### 2. 진단
```bash
# 로그 확인
vercel logs --since 30m

# 에러 추적
curl https://gameplaza.vercel.app/api/v2/metrics | jq '.recent_errors'

# 데이터베이스 연결 확인
psql $DATABASE_URL -c "SELECT 1;"
```

##### 3. 복구
```bash
# 서비스 재시작
vercel redeploy

# 캐시 초기화
curl -X POST https://gameplaza.vercel.app/api/admin/cache/clear

# 데이터베이스 연결 풀 리셋
curl -X POST https://gameplaza.vercel.app/api/admin/db/reset-pool
```

#### P2 - High 대응

##### 1. 영향 최소화
```bash
# Feature flag로 문제 기능 비활성화
vercel env add FEATURE_FLAG_PROBLEMATIC_FEATURE false

# 트래픽 제한
vercel env add RATE_LIMIT_MULTIPLIER 0.5
```

##### 2. 상세 분석
```bash
# 성능 프로파일링
curl https://gameplaza.vercel.app/api/v2/debug/profile

# 느린 쿼리 확인
psql $DATABASE_URL -c "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

#### P3/P4 - Medium/Low 대응

##### 1. 문제 기록
```bash
# GitHub 이슈 생성
gh issue create \
  --title "[P3] 예약 목록 로딩 지연" \
  --body "## 문제 설명\n..." \
  --label "bug,production"
```

##### 2. 임시 조치
```javascript
// 임시 패치 예시
if (process.env.TEMP_FIX_ENABLED === 'true') {
  // 임시 해결 코드
}
```

### 4️⃣ 복구 (Recovery)

#### 복구 확인 체크리스트
```markdown
[ ] 모든 API 엔드포인트 정상 응답
[ ] 에러율 1% 미만
[ ] 응답 시간 200ms 미만
[ ] 모든 헬스체크 통과
[ ] 사용자 피드백 확인
```

#### 복구 검증 스크립트
```bash
#!/bin/bash
# recovery-check.sh

echo "🔍 복구 상태 확인 중..."

# 헬스 체크
./scripts/health-check.sh https://gameplaza.vercel.app

# 주요 기능 테스트
npm run test:e2e -- --tag=critical

# 성능 확인
./scripts/monitor-metrics.sh https://gameplaza.vercel.app 100
```

### 5️⃣ 사후 분석 (Post-Mortem)

#### 사후 분석 템플릿
```markdown
# 인시던트 사후 분석 보고서

## 개요
- **발생 시간**: 2024-XX-XX HH:MM KST
- **복구 시간**: 2024-XX-XX HH:MM KST
- **총 다운타임**: X분
- **영향받은 사용자**: 약 X명
- **심각도**: P1/P2/P3/P4

## 타임라인
- HH:MM - 첫 알림 수신
- HH:MM - 문제 확인 및 대응 시작
- HH:MM - 근본 원인 파악
- HH:MM - 임시 조치 적용
- HH:MM - 완전 복구 확인

## 근본 원인
[상세 설명]

## 영향
- 기술적 영향:
- 비즈니스 영향:
- 사용자 영향:

## 대응 조치
1. 즉시 조치:
2. 단기 조치:
3. 장기 개선:

## 잘한 점
- 
- 

## 개선할 점
- 
- 

## 액션 아이템
| 항목 | 담당자 | 기한 | 상태 |
|------|--------|------|------|
| | | | |
```

## 🛠️ 도구 및 명령어

### 긴급 명령어 모음

```bash
# 🔴 긴급 롤백
./scripts/canary-deploy.ts rollback

# 🟠 트래픽 조절
./scripts/canary-deploy.ts adjust 50  # 50%로 조정

# 🟡 캐시 클리어
curl -X DELETE https://gameplaza.vercel.app/api/admin/cache

# 🟢 메트릭 리셋
curl -X DELETE https://gameplaza.vercel.app/api/v2/metrics

# 🔵 로그 조회
vercel logs --since 1h | grep ERROR

# 🟣 데이터베이스 상태
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"
```

### 모니터링 URL

| 서비스 | URL | 용도 |
|--------|-----|------|
| Health Check | /api/v2/health | 기본 상태 확인 |
| Ready Check | /api/v2/ready | 준비 상태 확인 |
| DB Health | /api/v2/health/db | DB 상태 확인 |
| Dependencies | /api/v2/health/dependencies | 외부 서비스 상태 |
| Metrics | /api/v2/metrics | 성능 메트릭 |
| Memory | /api/v2/health/memory | 메모리 사용량 |

## 📞 외부 지원 요청

### Vercel 지원
```bash
# Vercel 지원 티켓 생성
vercel support

# 긴급 지원 (Enterprise)
# Email: enterprise-support@vercel.com
```

### Supabase 지원
```bash
# Supabase 대시보드에서 지원 요청
# URL: https://app.supabase.com/support

# 긴급 지원
# Email: support@supabase.io
```

## 🔐 보안 인시던트

### 보안 침해 발생 시
1. **즉시 격리**: 영향받은 서비스 중단
2. **증거 보존**: 로그 및 상태 백업
3. **보안팀 연락**: security@gameplaza.com
4. **비밀번호 변경**: 모든 관련 계정
5. **감사 로그 확인**: 침해 범위 파악

### 데이터 유출 시
1. **접근 차단**: API 키 및 토큰 무효화
2. **영향 평가**: 유출된 데이터 범위 확인
3. **법무팀 연락**: legal@gameplaza.com
4. **사용자 통보**: 영향받은 사용자 알림
5. **규제 신고**: 필요시 관련 기관 신고

## 📝 체크리스트 및 템플릿

### 인시던트 대응 체크리스트
- [ ] 심각도 평가 완료
- [ ] 관련 팀원 소집
- [ ] 상태 페이지 업데이트
- [ ] 초기 대응 시작
- [ ] 근본 원인 파악
- [ ] 복구 계획 수립
- [ ] 복구 작업 실행
- [ ] 복구 확인 테스트
- [ ] 사용자 공지
- [ ] 사후 분석 일정 확정

### 커뮤니케이션 템플릿

#### 내부 알림
```
🚨 [P1] 서비스 장애 발생

시간: YYYY-MM-DD HH:MM KST
영향: [영향 범위 설명]
증상: [문제 증상 설명]
대응: [현재 대응 상황]

담당: @담당자
스레드에서 업데이트 예정
```

#### 사용자 공지
```
안녕하세요, 게임플라자입니다.

현재 일부 사용자께서 [서비스명]을 이용하시는데 
불편을 겪고 계십니다.

발생 시간: YYYY-MM-DD HH:MM
영향 범위: [영향 설명]
예상 복구: [예상 시간]

빠른 시일 내에 정상화하도록 하겠습니다.
불편을 드려 죄송합니다.
```

## 🔄 정기 훈련

### 월간 훈련
- 장애 대응 시뮬레이션
- 롤백 절차 연습
- 커뮤니케이션 훈련

### 분기별 검토
- 플레이북 업데이트
- 도구 및 스크립트 점검
- 연락처 정보 확인

---

마지막 업데이트: 2024-01-23
다음 검토 예정: 2024-02-23