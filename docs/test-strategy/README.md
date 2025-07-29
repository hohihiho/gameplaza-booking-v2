# 🧪 게임플라자 예약 시스템 - 테스트 전략 문서

이 디렉토리는 게임플라자 예약 시스템의 포괄적인 테스트 전략과 가이드라인을 포함합니다.

## 📋 문서 목록

### 🎯 핵심 전략 문서
| 문서 | 설명 | 대상 |
|------|------|------|
| **[testing-guide.md](./testing-guide.md)** | **메인 가이드** - 전체 테스트 철학, 베스트 프랙티스, 실행 방법 | 모든 개발자 |
| [test-priority-matrix.md](./test-priority-matrix.md) | 위험도 기반 테스트 우선순위 및 단계별 실행 계획 | QA 엔지니어, 팀 리더 |

### 🔧 기술 문서
| 문서 | 설명 | 대상 |
|------|------|------|
| [test-environment-review.md](./test-environment-review.md) | 현재 테스트 도구 상태 및 개선 권장사항 | DevOps, QA 엔지니어 |
| [test-templates.md](./test-templates.md) | 표준화된 테스트 코드 템플릿 및 패턴 | 모든 개발자 |
| [coverage-improvement-plan.md](./coverage-improvement-plan.md) | 커버리지 45% → 80% 달성 로드맵 | QA 엔지니어, 개발 리더 |

### 📱 특화 전략
| 문서 | 설명 | 대상 |
|------|------|------|
| [mobile-testing-strategy.md](./mobile-testing-strategy.md) | 모바일 퍼스트 테스트 전략 (3G, 다양한 디바이스) | Frontend 개발자, QA |
| [performance-test-standards.md](./performance-test-standards.md) | Lighthouse 기준, 모바일 성능 표준 | Frontend 개발자, DevOps |

---

## 🚀 빠른 시작

### 1. 테스트 실행
```bash
# 전체 테스트 스위트 (권장)
./scripts/test-local.sh

# 개별 테스트 타입
npm run test:coverage     # 단위 테스트 + 커버리지
npm run test:e2e         # E2E 테스트
npm run test:e2e:mobile  # 모바일 테스트
```

### 2. 새로운 테스트 작성
1. **[test-templates.md](./test-templates.md)** 에서 적절한 템플릿 선택
2. **[test-priority-matrix.md](./test-priority-matrix.md)** 에서 우선순위 확인
3. **[testing-guide.md](./testing-guide.md)** 의 베스트 프랙티스 적용

### 3. CI/CD 통합
- **PR 테스트**: `.github/workflows/test-ci.yml` (자동 실행)
- **야간 테스트**: `.github/workflows/nightly-tests.yml` (매일 2시)
- **Lighthouse 설정**: `lighthouse.config.js`

---

## 📊 현재 상태 (2025-07-24 기준)

### 테스트 커버리지
- **현재**: ~45%
- **목표**: 80%
- **계획**: [커버리지 개선 계획](./coverage-improvement-plan.md) 참조

### 테스트 인프라
- ✅ **Jest 30.0.5** - 단위/통합 테스트
- ✅ **Playwright 1.54.1** - E2E 테스트
- ✅ **MSW 2.10.4** - API 모킹
- ⚠️ **Lighthouse CI** - 설치 필요
- ⚠️ **접근성 테스트 도구** - jest-axe 설치 필요

### 우선 개선 필요 영역
1. **실패 테스트 수정** (time.test.ts, phone route.test.ts 등)
2. **Critical 영역 테스스 강화** (예약, 인증, 관리자)
3. **모바일 성능 최적화**

---

## 🎯 로드맵

### Phase 1: 기반 안정화 (2주)
- [ ] 실패 테스트 모두 수정
- [ ] Critical 영역 80% 커버리지 달성
- [ ] CI/CD 파이프라인 안정화

### Phase 2: 품질 강화 (2주)
- [ ] High Priority 영역 75% 커버리지
- [ ] 모바일 테스트 완전 자동화
- [ ] 성능 테스트 기준 충족

### Phase 3: 최적화 (2주)
- [ ] 전체 커버리지 80% 달성
- [ ] 테스트 실행 시간 5분 이내
- [ ] 지속적 모니터링 구축

---

## 🏆 성공 지표

### 품질 지표
- **테스트 커버리지**: 80% 이상
- **빌드 성공률**: 95% 이상
- **평균 수정 시간**: 24시간 이내
- **Critical 버그**: 0건

### 성능 지표
- **Lighthouse 점수**: 90점 이상 (모바일)
- **API 응답 시간**: 200ms 이하
- **페이지 로드**: 3초 이내 (3G)
- **테스트 실행 시간**: 5분 이내

---

## 🔗 관련 리소스

### 내부 문서
- [프로젝트 룰 (CLAUDE.md)](../../CLAUDE.md)
- [기획서](../planning/complete_specification.md)
- [에이전트 시스템](../agents/)

### 외부 참조
- [Jest 공식 문서](https://jestjs.io/docs/getting-started)
- [Playwright 가이드](https://playwright.dev/docs/intro)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

### 도구별 설정 파일
```
프로젝트 루트/
├── jest.config.js           # Jest 설정
├── jest.setup.js           # Jest 환경 설정
├── playwright.config.ts    # Playwright 설정
├── lighthouse.config.js    # Lighthouse CI 설정
└── .github/workflows/      # CI/CD 워크플로우
    ├── test-ci.yml
    └── nightly-tests.yml
```

---

## 🚨 중요 알림

### 개발자 준수사항
1. **PR 전 필수**: `./scripts/test-local.sh` 실행
2. **커버리지 유지**: 새 코드는 95% 이상 커버리지
3. **테스트 우선 작성**: TDD 접근법 권장
4. **모바일 테스트**: 모든 기능은 모바일에서 검증

### QA 체크포인트
- [ ] Critical 테스트 매일 실행
- [ ] 성능 테스트 주간 리뷰
- [ ] 커버리지 추이 모니터링
- [ ] 실패율 추적 및 분석

---

## 📞 지원 및 문의

### 내부 연락처
- **QA 리더**: [@qa-lead]
- **DevOps**: [@devops-team]
- **Frontend 리더**: [@frontend-lead]

### 이슈 리포팅
- **버그 리포트**: GitHub Issues
- **성능 문제**: Slack #performance
- **CI/CD 문제**: Slack #devops

### 긴급 상황
- **테스트 실패로 인한 배포 차단**: 온콜 담당자
- **Critical 버그 발견**: 즉시 팀 리더 연락

---

**이 문서는 지속적으로 업데이트됩니다. 최신 버전은 항상 이 README를 확인하세요.**

*마지막 업데이트: 2025-07-24*