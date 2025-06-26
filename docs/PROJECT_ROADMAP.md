# 광주 게임플라자 예약 시스템 - 프로젝트 로드맵

## 📋 프로젝트 개요
- **프로젝트명**: GamePlaza V2
- **개발 기간**: 6-7주
- **개발자**: 1인 (Claude AI 팀 지원)
- **목표**: 모바일 퍼스트 PWA 예약 시스템

## 🎯 마일스톤

### 🏁 Phase 0: 프로젝트 설정 (3일)
- [ ] GitHub 리포지토리 생성 및 설정
- [ ] 프로젝트 보드 구성
- [ ] 개발 환경 초기 설정
- [ ] 기본 문서 작성

### 🔧 Phase 1: 기초 인프라 구축 (1주)
#### Backend Setup
- [ ] Supabase 프로젝트 생성
- [ ] 데이터베이스 스키마 설계 및 구현
- [ ] RLS 정책 설정
- [ ] 기본 테이블 생성 (users, devices, reservations 등)

#### Frontend Setup  
- [ ] Next.js 프로젝트 초기화
- [ ] TypeScript 설정
- [ ] Tailwind CSS 설정
- [ ] PWA 기본 설정
- [ ] 기본 라우팅 구조

#### DevOps Setup
- [ ] GitHub Actions CI/CD 설정
- [ ] Vercel 프로젝트 연결
- [ ] 환경 변수 설정
- [ ] 도메인 연결 준비

### 🔐 Phase 2: 인증 시스템 (1주)
#### Authentication
- [ ] Google OAuth 구현
- [ ] Firebase FCM 설정
- [ ] 전화번호 인증 구현
- [ ] 세션 관리
- [ ] 권한 시스템 (일반/스태프/관리자)

#### User Management
- [ ] 회원가입 플로우
- [ ] 프로필 관리
- [ ] 마이페이지 기본 구조

### 📅 Phase 3: 예약 시스템 (2주)
#### Reservation Core
- [ ] 24시간 룰 엔진 구현
- [ ] 예약 신청 폼
- [ ] 실시간 가능 여부 체크
- [ ] 기기 선택 UI
- [ ] 마이마이 2P 옵션

#### Reservation Management
- [ ] 예약 목록 조회
- [ ] 예약 상태 관리
- [ ] 관리자 승인/거절 시스템
- [ ] 예약 취소 기능
- [ ] 예약 제한 설정

#### Notifications
- [ ] FCM 푸시 알림 구현
- [ ] 예약 승인/거절 알림
- [ ] 1시간 전 리마인더
- [ ] 관리자 알림

### 💼 Phase 4: 관리자 시스템 (2주)
#### Device Management
- [ ] 기기 관리 CRUD
- [ ] 대여 기기 관리 (분리)
- [ ] 드래그앤드롭 순서 변경
- [ ] 기기 상태 관리
- [ ] 점검 시간 설정

#### Check-in System
- [ ] 체크인 프로세스
- [ ] 기기 번호 자동 배정
- [ ] 계좌이체 알림 시스템
- [ ] 결제 확인 처리
- [ ] 백업 시스템 (관리자 폰)

#### Content Management
- [ ] 노코드 빌더 구현
- [ ] 홈페이지 편집
- [ ] 이용안내 편집
- [ ] 대여안내 편집
- [ ] 실시간 미리보기

#### Analytics
- [ ] 실시간 대시보드
- [ ] 예약 통계
- [ ] 매출 분석
- [ ] 고객 분석
- [ ] 데이터 내보내기

### 🎨 Phase 5: 사용자 경험 개선 (1주)
#### UI/UX Polish
- [ ] 모바일 최적화 검증
- [ ] 애니메이션 추가
- [ ] 로딩 상태 개선
- [ ] 에러 처리 개선
- [ ] 접근성 개선

#### Customer Features
- [ ] 고객 검색 시스템
- [ ] 블랙리스트 관리
- [ ] 개인 이용 통계
- [ ] 리뷰/평가 시스템

### 🧪 Phase 6: 테스트 및 최적화 (1주)
#### Testing
- [ ] 단위 테스트 작성
- [ ] E2E 테스트 구현
- [ ] 성능 테스트
- [ ] 보안 테스트
- [ ] 사용자 테스트

#### Optimization
- [ ] 성능 최적화
- [ ] SEO 최적화
- [ ] PWA 최적화
- [ ] 번들 사이즈 최적화

### 🚀 Phase 7: 배포 및 출시 (3일)
#### Deployment
- [ ] 프로덕션 환경 설정
- [ ] 최종 테스트
- [ ] 배포
- [ ] 모니터링 설정
- [ ] 백업 설정

#### Documentation
- [ ] 사용자 매뉴얼
- [ ] 관리자 매뉴얼
- [ ] API 문서
- [ ] 트러블슈팅 가이드

## 🏷️ 이슈 라벨 구조

### Type Labels
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 작업
- `style`: 스타일링
- `refactor`: 리팩토링
- `test`: 테스트
- `chore`: 기타 작업

### Priority Labels
- `P0`: 긴급 (당일 처리)
- `P1`: 높음 (2일 내)
- `P2`: 중간 (1주 내)
- `P3`: 낮음 (여유 있을 때)

### Agent Labels
- `frontend`: Frontend Developer
- `backend`: Backend Developer
- `ui-ux`: UI/UX Designer
- `security`: Security Expert
- `data`: Data Analyst
- `qa`: QA Engineer
- `devops`: DevOps
- `pm`: Project Manager

### Status Labels
- `todo`: 할 일
- `in-progress`: 진행 중
- `review`: 리뷰 대기
- `blocked`: 차단됨
- `done`: 완료

## 📊 주요 성과 지표 (KPI)

### 개발 지표
- 일정 준수율: 95% 이상
- 코드 커버리지: 80% 이상
- Lighthouse 점수: 90점 이상
- 버그 발생률: 5% 이하

### 비즈니스 지표
- 예약 전환율: 70% 이상
- 평균 응답 시간: 2초 이하
- 시스템 가용성: 99.9%
- 사용자 만족도: 90% 이상

## 🔍 리스크 관리

### 기술적 리스크
1. **Supabase 제한**: 프리 티어 한계 → 조기 모니터링 및 필요시 업그레이드
2. **FCM 안정성**: 알림 실패 → 백업 시스템 구현
3. **성능 이슈**: 모바일 환경 → 철저한 최적화

### 비즈니스 리스크
1. **요구사항 변경**: 빈번한 변경 → 애자일 방식으로 유연하게 대응
2. **사용자 적응**: 새 시스템 거부감 → 직관적 UI/UX, 충분한 안내
3. **운영 전환**: 기존 시스템과 병행 → 단계적 전환 계획

## 📝 개발 규칙

### 코드 품질
- 모든 코드는 TypeScript로 작성
- ESLint + Prettier 규칙 준수
- 컴포넌트는 100줄 이하
- 함수는 단일 책임 원칙

### 커밋 메시지
```
[타입] 제목 (이슈번호)

상세 설명 (필요시)

예: [feat] 예약 신청 폼 구현 (#23)
```

### 브랜치 명명
- `main`: 프로덕션
- `develop`: 개발
- `feature/이슈번호-기능명`
- `fix/이슈번호-버그명`

## 🎮 데이터 구조 상세

### Users Table
```sql
- id: UUID (PK)
- email: string (unique)
- name: string
- phone: string (verified)
- nickname: string
- role: enum (user, staff, admin)
- created_at: timestamp
- updated_at: timestamp
- last_login_at: timestamp
- is_blacklisted: boolean
- blacklist_reason: string
```

### Devices Table
```sql
- id: UUID (PK)
- name: string
- type: enum (rhythm, arcade, etc)
- model: string
- location: string
- status: enum (available, occupied, maintenance)
- display_order: integer
- is_rentable: boolean
- created_at: timestamp
- updated_at: timestamp
```

### Rental_Devices Table
```sql
- id: UUID (PK)
- device_id: UUID (FK)
- rental_type: enum (30min, 1hour, 2hour, etc)
- base_price: integer
- is_active: boolean
- max_players: integer (1 or 2)
- display_order: integer
```

### Time_Slots Table
```sql
- id: UUID (PK)
- name: string
- start_time: time
- end_time: time
- base_price: integer
- slot_type: enum (default, custom)
- is_active: boolean
- created_at: timestamp
- updated_at: timestamp
```

### Time_Slot_Schedules Table
```sql
- id: UUID (PK)
- time_slot_id: UUID (FK)
- applicable_date: date
- day_of_week: integer[]
- is_recurring: boolean
- priority: integer
- created_at: timestamp
```

### Reservations Table
```sql
- id: UUID (PK)
- user_id: UUID (FK)
- device_id: UUID (FK)
- time_slot_id: UUID (FK)
- device_number: integer
- date: date
- total_price: integer
- player_count: integer
- status: enum (pending, approved, rejected, completed, cancelled)
- approved_by: UUID (FK)
- approved_at: timestamp
- check_in_at: timestamp
- payment_method: enum (cash, transfer)
- payment_confirmed_at: timestamp
- notes: text
- created_at: timestamp
- updated_at: timestamp
```

### Settings Table
```sql
- key: string (PK)
- value: jsonb
- updated_at: timestamp
- updated_by: UUID (FK)
```

### Content_Sections Table
```sql
- id: UUID (PK)
- page: enum (home, guide, rental)
- section_type: string
- content: jsonb
- display_order: integer
- is_active: boolean
- created_at: timestamp
- updated_at: timestamp
```

## 🚦 다음 단계

1. **즉시 실행**: 
   - GitHub 리포지토리 생성
   - 프로젝트 보드 설정
   - 첫 번째 이슈들 생성

2. **오늘 완료**:
   - 개발 환경 설정
   - Supabase 프로젝트 생성
   - 기본 프로젝트 구조 생성

3. **이번 주 목표**:
   - Phase 1 완료
   - Phase 2 시작

---

작성일: 2024-06-26
프로젝트 매니저: Claude AI (PM Agent)