#!/bin/bash

echo "🚀 GamePlaza V2 전체 이슈 생성 스크립트"
echo "======================================="

# Phase 1: 기초 인프라
echo "📦 Phase 1: 기초 인프라 이슈 생성 중..."

# Backend Setup
gh issue create --title "[feat] RLS 정책 구현" --body "## 작업 내용
- 각 테이블별 RLS 정책 작성
- 권한별 접근 제어 구현
- 보안 규칙 테스트

## 담당: Backend Developer + Security Expert" --label "feat,P0,backend,security"

gh issue create --title "[feat] 기본 API 엔드포인트 구현" --body "## 작업 내용
- Supabase Edge Functions 설정
- 기본 CRUD API 구현
- 에러 핸들링

## 담당: Backend Developer" --label "feat,P1,backend"

# Frontend Setup
gh issue create --title "[feat] Tailwind CSS 및 디자인 시스템" --body "## 작업 내용
- Tailwind 설정 최적화
- 색상 팔레트 정의
- 컴포넌트 스타일 가이드
- 다크모드 지원

## 담당: Frontend Developer + UI/UX Designer" --label "feat,P1,frontend,ui-ux"

gh issue create --title "[feat] PWA 설정 구현" --body "## 작업 내용
- manifest.json 생성
- Service Worker 설정
- 오프라인 지원
- 홈 화면 추가 프롬프트

## 담당: Frontend Developer" --label "feat,P1,frontend"

gh issue create --title "[feat] 기본 컴포넌트 라이브러리" --body "## 작업 내용
- Button, Input, Card 등 기본 컴포넌트
- 모바일 최적화
- Storybook 설정

## 담당: Frontend Developer + UI/UX Designer" --label "feat,P1,frontend,ui-ux"

# Phase 2: 인증 시스템
echo "🔐 Phase 2: 인증 시스템 이슈 생성 중..."

gh issue create --title "[feat] Google OAuth 구현" --body "## 작업 내용
- Supabase Auth 설정
- OAuth 플로우 구현
- 세션 관리
- 리프레시 토큰 처리

## 담당: Backend Developer + Security Expert" --label "feat,P0,backend,security"

gh issue create --title "[feat] Firebase FCM 설정 및 전화번호 인증" --body "## 작업 내용
- Firebase 프로젝트 설정
- FCM SDK 연동
- SMS 인증 구현
- 전화번호 검증 로직

## 담당: Backend Developer + Security Expert" --label "feat,P0,backend,security"

gh issue create --title "[feat] 권한 시스템 구현" --body "## 작업 내용
- 일반/스태프/관리자 권한 구분
- 미들웨어 구현
- 권한별 라우팅 보호
- 권한 검증 헬퍼 함수

## 담당: Backend Developer + Security Expert" --label "feat,P0,backend,security"

gh issue create --title "[feat] 로그인/회원가입 UI" --body "## 작업 내용
- 구글 로그인 버튼
- 전화번호 입력 폼
- OTP 입력 UI
- 에러 처리 UI

## 담당: Frontend Developer + UI/UX Designer" --label "feat,P0,frontend,ui-ux"

gh issue create --title "[feat] 마이페이지 구현" --body "## 작업 내용
- 프로필 정보 표시/수정
- 예약 내역 조회
- 설정 메뉴
- 로그아웃

## 담당: Frontend Developer + UI/UX Designer" --label "feat,P1,frontend,ui-ux"

# Phase 3: 예약 시스템
echo "📅 Phase 3: 예약 시스템 이슈 생성 중..."

gh issue create --title "[feat] 24시간 룰 엔진" --body "## 작업 내용
- 예약 가능 시간 계산 로직
- 중복 예약 방지
- 예약 제한 규칙 적용
- 시간대별 가격 정책

## 담당: Backend Developer" --label "feat,P0,backend"

gh issue create --title "[feat] 예약 신청 API" --body "## 작업 내용
- 예약 생성 엔드포인트
- 검증 로직 구현
- 트랜잭션 처리
- 에러 응답 표준화

## 담당: Backend Developer" --label "feat,P0,backend"

gh issue create --title "[feat] 예약 캘린더 UI" --body "## 작업 내용
- 날짜 선택 캘린더
- 시간 슬롯 선택
- 예약 현황 표시
- 모바일 최적화

## 담당: Frontend Developer + UI/UX Designer" --label "feat,P0,frontend,ui-ux"

gh issue create --title "[feat] 기기 선택 UI" --body "## 작업 내용
- 기기 목록 표시
- 필터링 기능
- 기기 상태 실시간 표시
- 2P 옵션 선택

## 담당: Frontend Developer + UI/UX Designer" --label "feat,P0,frontend,ui-ux"

gh issue create --title "[feat] 실시간 동기화 구현" --body "## 작업 내용
- Supabase Realtime 설정
- 예약 상태 실시간 업데이트
- 낙관적 업데이트 구현
- 충돌 해결 로직

## 담당: Frontend Developer + Backend Developer" --label "feat,P0,frontend,backend"

gh issue create --title "[feat] FCM 푸시 알림" --body "## 작업 내용
- 서비스 워커 설정
- 알림 권한 요청 UI
- 알림 전송 로직
- 알림 템플릿 관리

## 담당: Backend Developer + Frontend Developer" --label "feat,P0,backend,frontend"

gh issue create --title "[feat] 예약 승인/거절 시스템" --body "## 작업 내용
- 관리자 예약 관리 페이지
- 승인/거절 API
- 상태 변경 알림
- 일괄 처리 기능

## 담당: Backend Developer + Frontend Developer" --label "feat,P0,backend,frontend"

gh issue create --title "[feat] 예약 취소 기능" --body "## 작업 내용
- 사용자 예약 취소
- 취소 규정 적용
- 환불 처리 로직
- 취소 알림

## 담당: Backend Developer + Frontend Developer" --label "feat,P1,backend,frontend"

# Phase 4: 관리자 시스템
echo "👨‍💼 Phase 4: 관리자 시스템 이슈 생성 중..."

gh issue create --title "[feat] 관리자 대시보드" --body "## 작업 내용
- 오늘의 예약 현황
- 실시간 통계
- 주요 지표 표시
- 알림 센터

## 담당: Frontend Developer + Data Analyst" --label "feat,P0,frontend,data"

gh issue create --title "[feat] 기기 관리 시스템" --body "## 작업 내용
- 기기 CRUD
- 상태 관리
- 점검 일정 설정
- QR 코드 생성

## 담당: Frontend Developer + Backend Developer" --label "feat,P0,frontend,backend"

gh issue create --title "[feat] 대여 기기 관리" --body "## 작업 내용
- 대여 가능 기기 설정
- 가격 정책 관리
- 시간대별 설정
- 특별 요금 설정

## 담당: Frontend Developer + Backend Developer" --label "feat,P0,frontend,backend"

gh issue create --title "[feat] 드래그앤드롭 순서 관리" --body "## 작업 내용
- DnD 라이브러리 연동
- 순서 저장 API
- 실시간 동기화
- 터치 지원

## 담당: Frontend Developer + UI/UX Designer" --label "feat,P1,frontend,ui-ux"

gh issue create --title "[feat] 체크인 시스템" --body "## 작업 내용
- 체크인 프로세스 구현
- 기기 자동 배정
- QR 코드 스캔
- 체크인 확인 알림

## 담당: Frontend Developer + Backend Developer" --label "feat,P0,frontend,backend"

gh issue create --title "[feat] 계좌이체 알림 시스템" --body "## 작업 내용
- 계좌정보 저장/관리
- FCM 알림 전송
- 클립보드 복사
- 백업 화면 표시

## 담당: Frontend Developer + Backend Developer" --label "feat,P0,frontend,backend"

gh issue create --title "[feat] 노코드 CMS 빌더" --body "## 작업 내용
- 섹션 관리 시스템
- 드래그앤드롭 편집
- 실시간 미리보기
- 이미지 업로드

## 담당: Frontend Developer + UI/UX Designer" --label "feat,P1,frontend,ui-ux"

gh issue create --title "[feat] 통계 및 분석" --body "## 작업 내용
- 매출 통계
- 이용 패턴 분석
- 고객 분석
- 차트 시각화

## 담당: Data Analyst + Frontend Developer" --label "feat,P1,data,frontend"

gh issue create --title "[feat] 데이터 내보내기" --body "## 작업 내용
- Excel 내보내기
- CSV 다운로드
- PDF 리포트
- Google Sheets 연동

## 담당: Backend Developer + Data Analyst" --label "feat,P2,backend,data"

gh issue create --title "[feat] 고객 관리 시스템" --body "## 작업 내용
- 고객 검색/필터
- 상세 정보 조회
- 이용 내역
- 메모 기능

## 담당: Frontend Developer + Backend Developer" --label "feat,P1,frontend,backend"

gh issue create --title "[feat] 블랙리스트 관리" --body "## 작업 내용
- 블랙리스트 등록/해제
- 사유 관리
- 자동 차단 로직
- 이력 관리

## 담당: Backend Developer + Security Expert" --label "feat,P1,backend,security"

# Phase 5: UX 개선
echo "🎨 Phase 5: UX 개선 이슈 생성 중..."

gh issue create --title "[feat] 모바일 최적화" --body "## 작업 내용
- 터치 영역 최적화
- 스와이프 제스처
- 가로/세로 모드 대응
- 성능 최적화

## 담당: Frontend Developer + UI/UX Designer" --label "feat,P1,frontend,ui-ux"

gh issue create --title "[feat] 애니메이션 구현" --body "## 작업 내용
- 페이지 전환 효과
- 마이크로 인터랙션
- 로딩 애니메이션
- 스켈레톤 UI

## 담당: Frontend Developer + UI/UX Designer" --label "feat,P2,frontend,ui-ux"

gh issue create --title "[feat] 접근성 개선" --body "## 작업 내용
- 스크린 리더 지원
- 키보드 네비게이션
- 고대비 모드
- 폰트 크기 조절

## 담당: Frontend Developer + UI/UX Designer" --label "feat,P1,frontend,ui-ux"

gh issue create --title "[feat] 에러 처리 개선" --body "## 작업 내용
- 친화적인 에러 메시지
- 재시도 로직
- 오프라인 처리
- 에러 리포팅

## 담당: Frontend Developer + QA Engineer" --label "feat,P1,frontend,qa"

gh issue create --title "[feat] 검색 기능 강화" --body "## 작업 내용
- 전문 검색
- 자동완성
- 필터 조합
- 검색 기록

## 담당: Frontend Developer + Backend Developer" --label "feat,P2,frontend,backend"

# Phase 6: 테스트
echo "🧪 Phase 6: 테스트 이슈 생성 중..."

gh issue create --title "[test] 단위 테스트 작성" --body "## 작업 내용
- 비즈니스 로직 테스트
- 유틸리티 함수 테스트
- 컴포넌트 테스트
- 커버리지 80% 달성

## 담당: QA Engineer" --label "test,P1,qa"

gh issue create --title "[test] E2E 테스트 구현" --body "## 작업 내용
- Playwright 설정
- 주요 시나리오 테스트
- CI 파이프라인 연동
- 크로스 브라우저 테스트

## 담당: QA Engineer" --label "test,P1,qa"

gh issue create --title "[test] 성능 테스트" --body "## 작업 내용
- Lighthouse CI 설정
- 성능 지표 측정
- 번들 사이즈 분석
- 최적화 제안

## 담당: QA Engineer + DevOps" --label "test,P1,qa,devops"

gh issue create --title "[test] 보안 테스트" --body "## 작업 내용
- 취약점 스캔
- 펜테스트
- OWASP 체크리스트
- 보안 감사 리포트

## 담당: Security Expert + QA Engineer" --label "test,P0,security,qa"

gh issue create --title "[refactor] 코드 최적화" --body "## 작업 내용
- 코드 리팩토링
- 번들 사이즈 최적화
- 이미지 최적화
- 캐싱 전략

## 담당: Frontend Developer + Backend Developer" --label "refactor,P1,frontend,backend"

# 인프라 및 배포
echo "🚀 인프라 및 배포 이슈 생성 중..."

gh issue create --title "[chore] CI/CD 파이프라인" --body "## 작업 내용
- GitHub Actions 워크플로우
- 자동 테스트
- 배포 자동화
- 환경별 설정

## 담당: DevOps" --label "chore,P0,devops"

gh issue create --title "[chore] 모니터링 설정" --body "## 작업 내용
- Sentry 에러 추적
- Vercel Analytics
- 성능 모니터링
- 알림 설정

## 담당: DevOps" --label "chore,P0,devops"

gh issue create --title "[chore] 백업 시스템" --body "## 작업 내용
- 자동 백업 설정
- 복구 절차 문서화
- 백업 테스트
- 데이터 보관 정책

## 담당: DevOps + Backend Developer" --label "chore,P1,devops,backend"

gh issue create --title "[docs] 사용자 매뉴얼" --body "## 작업 내용
- 사용자 가이드 작성
- FAQ 작성
- 비디오 튜토리얼
- 도움말 페이지

## 담당: Project Manager" --label "docs,P1,pm"

gh issue create --title "[docs] 관리자 매뉴얼" --body "## 작업 내용
- 관리자 기능 설명
- 운영 가이드
- 트러블슈팅
- 베스트 프랙티스

## 담당: Project Manager" --label "docs,P1,pm"

gh issue create --title "[docs] API 문서화" --body "## 작업 내용
- API 스펙 작성
- Swagger/OpenAPI
- 예제 코드
- 인증 가이드

## 담당: Backend Developer" --label "docs,P2,backend"

gh issue create --title "[chore] 프로덕션 배포" --body "## 작업 내용
- 환경 변수 설정
- 도메인 연결
- SSL 인증서
- 최종 점검

## 담당: DevOps" --label "chore,P0,devops"

echo "✅ 모든 이슈가 생성되었습니다!"
echo "총 이슈 수: 50개 이상"
echo "GitHub에서 확인: https://github.com/hohihiho/gameplaza-booking-v2/issues"