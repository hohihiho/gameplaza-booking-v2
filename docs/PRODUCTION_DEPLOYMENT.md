# 🚀 프로덕션 배포 가이드

현재는 개발 환경이지만, 나중에 프로덕션으로 배포할 때를 위한 준비 사항들입니다.

## 📋 프로덕션 배포 체크리스트

### 1. 🗄️ 데이터베이스 백업 활성화

#### GitHub Actions 백업 활성화
`.github/workflows/database-backup.yml`에서 스케줄 주석 해제:

```yaml
on:
  # 프로덕션 배포 시 이 주석을 해제하세요
  schedule:
    - cron: '0 2 * * *'  # 매일 새벽 2시
```

#### 백업용 비공개 리포지토리 생성
1. GitHub에서 새 비공개 리포지토리 생성: `your-username/gameplaza-backups`
2. GitHub Secrets 설정:
   ```
   BACKUP_REPO_PAT: GitHub Personal Access Token (repo 권한)
   SUPABASE_URL: 프로덕션 Supabase URL
   SUPABASE_SERVICE_ROLE_KEY: 프로덕션 Service Role Key
   DATABASE_URL: 프로덕션 Database URL (선택적)
   ```

### 2. 🔐 보안 설정

#### 환경 변수 분리
- 개발용: `.env.local`
- 프로덕션용: Vercel/Netlify 환경 변수 또는 서버 환경 변수

#### 필수 보안 체크
- [ ] API 키 로테이션
- [ ] RLS (Row Level Security) 정책 검토
- [ ] CORS 설정 확인
- [ ] Rate Limiting 설정

### 3. 📊 모니터링 설정

#### 백업 모니터링
```bash
# 수동 백업 테스트
npm run backup:status

# 백업 복원 테스트 (스테이징에서)
npm run restore:list
npm run restore
```

#### 알림 설정 (선택적)
- Slack 웹훅
- 이메일 알림
- Discord 알림

## 🛠️ 현재 개발 환경에서 할 수 있는 것들

### 백업 시스템 테스트
```bash
# JSON 백업 테스트 (항상 가능)
npm run backup:json

# 백업 상태 확인
npm run backup:status

# 복원 테스트 (별도 Supabase 프로젝트에서)
npm run restore:list
```

### GitHub Actions 테스트
1. Repository → Actions → "Database Backup (Production Only)"
2. "Run workflow" 클릭
3. 백업 유형 선택 후 실행

## 📈 프로덕션 배포 시나리오

### 시나리오 1: Vercel 배포
1. Vercel에 환경 변수 설정
2. 프로덕션 Supabase 프로젝트 생성
3. GitHub Actions 백업 활성화
4. 도메인 연결 및 SSL 설정

### 시나리오 2: 자체 서버 배포
1. 서버에 Node.js 환경 구축
2. PM2 또는 Docker로 프로세스 관리
3. Nginx 리버스 프록시 설정
4. 백업 크론잡 설정

## 🚨 데이터 마이그레이션 전략

### 개발 → 스테이징 → 프로덕션
```bash
# 1. 개발 데이터 백업
npm run backup

# 2. 스테이징에 복원
npm run restore

# 3. 검증 후 프로덕션 배포
# (동일한 과정 반복)
```

## 💡 개발 중 고려사항

### 1. 데이터 일관성
- 개발 중인 기능이 기존 데이터와 호환되는지 확인
- 마이그레이션 스크립트 준비

### 2. 성능 최적화
- 인덱스 최적화
- 쿼리 성능 모니터링
- 이미지/파일 최적화

### 3. 보안 강화
- SQL Injection 방지
- XSS 방지
- CSRF 토큰 사용

## 🔄 롤백 계획

만약 프로덕션 배포 후 문제가 생기면:

1. **즉시 롤백**
   ```bash
   # 최신 백업으로 복원
   npm run restore
   ```

2. **문제 분석**
   - 로그 확인
   - 에러 추적
   - 사용자 영향 평가

3. **수정 후 재배포**
   - 개발 환경에서 수정
   - 스테이징에서 테스트
   - 프로덕션 재배포

---

**결론**: 현재는 개발 중이니까 백업 시스템을 만들어두고, 프로덕션 배포할 때 활성화하면 됩니다! 🎯

지금은 개발에 집중하시고, 나중에 실제 서비스할 때 이 가이드를 참고하시면 됩니다.