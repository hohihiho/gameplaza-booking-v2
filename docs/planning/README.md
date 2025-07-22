# 📚 게임플라자 기획 문서 가이드

## 🗂️ 문서 구조

게임플라자 예약 시스템의 기획 문서는 다음과 같은 계층 구조로 구성되어 있습니다:

```
기획 문서 구조
├── 📘 통합 기획서 (Master Document)
│   └── complete_specification.md
│
├── 📗 상세 기능서 (Feature Documents)
│   ├── time_slot_system.md - 시간대 시스템 상세
│   ├── device_number_reservation.md - 기기 예약 시스템
│   ├── time_adjustment_implementation_plan.md - 시간 조정 기능
│   └── operation_insights.md - 운영 인사이트
│
├── 📙 흐름도 및 가이드 (Flow Documents)
│   ├── user_flow.md - 사용자 플로우
│   ├── admin_flow.md - 관리자 플로우
│   └── usage_guide_content.md - 사용 가이드
│
├── 📕 디자인 문서 (Design Documents)
│   ├── design_guide.md - 디자인 가이드라인
│   └── wireframes_collection.md - 와이어프레임 모음
│
└── 📓 개발 계획 (Development Plans)
    └── mvp_development_plan.md - MVP 개발 계획
```

## 📖 문서별 설명

### 1. 통합 기획서 (Master Document)
- **[complete_specification.md](./complete_specification.md)**
  - 프로젝트 전체 개요와 핵심 기능을 포괄적으로 다루는 메인 문서
  - 모든 상세 문서의 허브 역할
  - 최신 업데이트 상태 유지

### 2. 상세 기능서 (Feature Documents)

#### 시간 관리 시스템
- **[time_slot_system.md](./time_slot_system.md)**
  - KST 타임존 처리 로직
  - 24시간 표시 체계 (24~29시)
  - 영업일 기준 06시 리셋 정책

#### 기기 예약 시스템
- **[device_number_reservation.md](./device_number_reservation.md)**
  - 기기 번호 예약 시스템
  - 1인 1대 원칙
  - 실시간 가용성 체크

#### 시간 조정 기능
- **[time_adjustment_implementation_plan.md](./time_adjustment_implementation_plan.md)**
  - 예약 시간 조정 기능
  - 금액 수동 조정
  - 조정 이력 관리

#### 운영 인사이트
- **[operation_insights.md](./operation_insights.md)**
  - 실제 운영 경험 기반 인사이트
  - 베스트 프랙티스
  - 문제 해결 가이드

### 3. 흐름도 및 가이드 (Flow Documents)

#### 사용자 플로우
- **[user_flow.md](./user_flow.md)**
  - 일반 사용자 여정
  - 예약 프로세스
  - 마이페이지 기능

#### 관리자 플로우
- **[admin_flow.md](./admin_flow.md)**
  - 관리자 워크플로우
  - 체크인 프로세스
  - 운영 관리 기능

#### 사용 가이드
- **[usage_guide_content.md](./usage_guide_content.md)**
  - 사용자 가이드 콘텐츠
  - FAQ
  - 도움말 내용

### 4. 디자인 문서 (Design Documents)

#### 디자인 가이드
- **[design_guide.md](./design_guide.md)**
  - UI/UX 가이드라인
  - 색상 팔레트
  - 타이포그래피

#### 와이어프레임
- **[wireframes_collection.md](./wireframes_collection.md)**
  - 주요 화면 와이어프레임
  - 모바일 레이아웃
  - 반응형 디자인

### 5. 개발 계획 (Development Plans)

#### MVP 개발 계획
- **[mvp_development_plan.md](./mvp_development_plan.md)**
  - 단계별 개발 계획
  - 마일스톤
  - 일정 관리

## 🔄 문서 관리 가이드

### 업데이트 규칙
1. **기능 변경 시**: 해당 상세 기능서 먼저 업데이트
2. **전체 영향**: 통합 기획서에 변경사항 반영
3. **연관 문서**: 관련된 모든 문서 동기화

### 버전 관리
- 각 문서에 최종 업데이트 날짜 명시
- 중요 변경사항은 변경 이력 섹션에 기록
- git 커밋 메시지에 문서 업데이트 내용 포함

### 참조 방법
- 상세 내용은 관련 문서 링크로 연결
- 중복 내용 최소화
- 각 문서는 독립적으로도 이해 가능하도록 작성

## 📍 빠른 참조

| 찾고자 하는 내용 | 참조 문서 |
|-----------------|-----------|
| 전체 프로젝트 개요 | [통합 기획서](./complete_specification.md) |
| 예약 시간 처리 방식 | [시간대 시스템](./time_slot_system.md) |
| 기기 선택 프로세스 | [기기 예약 시스템](./device_number_reservation.md) |
| 관리자 기능 전체 | [관리자 플로우](./admin_flow.md) |
| UI 디자인 가이드 | [디자인 가이드](./design_guide.md) |
| 개발 일정 | [MVP 개발 계획](./mvp_development_plan.md) |

## 🏷️ 태그 시스템

각 문서는 다음 태그로 분류됩니다:

- `#core` - 핵심 기능
- `#admin` - 관리자 기능
- `#user` - 사용자 기능
- `#design` - 디자인 관련
- `#technical` - 기술 구현
- `#operation` - 운영 관련

## 🔗 상호 참조

문서 간의 연결 관계와 키워드별 위치를 찾으려면:
- **[상호 참조 가이드](./CROSS_REFERENCE.md)** - 기능별 문서 매핑 및 키워드 인덱스

---

💡 **팁**: 문서를 찾을 때는 먼저 이 README를 확인하여 필요한 문서를 빠르게 찾으세요.