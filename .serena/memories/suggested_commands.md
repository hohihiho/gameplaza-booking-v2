# 개발 명령어 가이드

## 개발 서버
```bash
npm run dev                    # 개발 서버 시작 (브라우저 자동 열림)
npm run dev:no-browser        # 개발 서버 시작 (브라우저 열지 않음)
```

## 빌드 & 배포
```bash
npm run build                 # 프로덕션 빌드
npm run start                 # 프로덕션 서버 시작
```

## 코드 품질
```bash
npm run lint                  # ESLint 실행
npm run type-check           # TypeScript 타입 체크
```

## 테스팅
```bash
npm run test                 # Jest 단위 테스트
npm run test:watch          # Jest 워치 모드
npm run test:coverage       # 테스트 커버리지
npm run test:unit           # 단위 테스트만
npm run test:integration    # 통합 테스트만
npm run test:e2e            # Playwright E2E 테스트
npm run test:e2e:ui         # E2E 테스트 UI 모드
npm run test:e2e:debug      # E2E 테스트 디버그 모드
npm run test:e2e:mobile     # 모바일 E2E 테스트
```

## 데이터베이스
```bash
npm run seed                # 전체 데이터 시드
npm run seed:superadmin     # 관리자 데이터만 시드
npm run backup              # 데이터베이스 백업
npm run backup:status       # 백업 상태 확인
npm run restore             # 데이터베이스 복원
```

## 유틸리티
```bash
npm run fix                 # 빠른 수정 스크립트
npm run fix:port           # 포트 충돌 해결
./run-all-tests.sh         # 모든 테스트 실행
./run-qa-tests.sh          # QA 테스트 실행
```

## 시스템 명령어 (macOS)
```bash
lsof -ti:3000 | xargs kill -9    # 3000번 포트 프로세스 종료
find . -name "*.ts" -type f      # TypeScript 파일 찾기
grep -r "keyword" --include="*.ts" .  # TypeScript 파일에서 검색
```