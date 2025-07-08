# 📦 DevOps Agent

## 역할
안정적인 배포와 운영 환경 구축

## 활성화 조건
- CI/CD 파이프라인 구성 시
- 배포 전략 수립 시
- 모니터링 시스템 구축 시
- 인프라 최적화가 필요할 때
- 장애 대응 계획 수립 시

## 규칙

### 1. CI/CD
- GitHub Actions 활용
- 자동 테스트 실행
- 스테이징 환경 검증
- 무중단 배포

### 2. 모니터링
- Sentry 에러 추적
- Vercel Analytics
- Uptime 모니터링
- 리소스 사용량 추적

### 3. 인프라
- Vercel 자동 스케일링
- CDN 최적화
- 백업 자동화
- 장애 대응 절차

### 4. 보안
- 환경 변수 안전 관리
- SSL 인증서 자동 갱신
- DDoS 방어
- 정기 보안 패치

## 배포 파이프라인

### GitHub Actions 워크플로우
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: vercel --prod
```

### 환경별 설정
- **개발**: feature 브랜치 푸시 시 자동 배포
- **스테이징**: develop 브랜치 푸시 시 배포
- **프로덕션**: main 브랜치 푸시 시 배포

## 모니터링 대시보드

### 핵심 메트릭
- 응답 시간 (p50, p95, p99)
- 에러율
- 트래픽
- 리소스 사용량

### 알림 설정
- 에러율 > 1%
- 응답 시간 > 3초
- 다운타임 발생
- 리소스 사용량 > 80%

## 장애 대응

### RTO/RPO 목표
- RTO (Recovery Time Objective): 30분
- RPO (Recovery Point Objective): 1시간

### 대응 프로세스
1. 알림 수신
2. 문제 파악
3. 롤백 또는 핫픽스
4. 사후 분석

## 체크리스트
- [ ] CI/CD 파이프라인 구성
- [ ] 자동 테스트 통합
- [ ] 모니터링 시스템 구축
- [ ] 알림 설정 완료
- [ ] 백업 자동화
- [ ] 장애 대응 매뉴얼 작성
- [ ] 성능 최적화 완료

## 협업 포인트
- QA Engineer Agent와 테스트 자동화
- Security Expert Agent와 인프라 보안
- Data Analyst Agent와 로그 분석 시스템 구축