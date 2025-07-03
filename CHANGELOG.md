# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2025-07-03

### Added
- 예약 내역 및 관리자 예약 관리 페이지에 페이지네이션 추가 (10개씩 표시)
- 상단 고정 헤더로 필터와 페이지네이션 항상 접근 가능
- 예약 신청 시 크레딧 타입 선택 기능 (고정크레딧/프리플레이/무한크레딧)
- 기기 현황 페이지에 플레이 모드별 가격 표시
- 기기 현황 및 예약 안내사항 관리 기능
- 예약 취소 시 사유 선택 옵션 (대여 인원 부족/회원 요청/기타)

### Changed
- 예약 신청 UX 개선: 선택 즉시 다음 단계로 자동 진행
- 예약 신청 이전 버튼을 상단으로 이동
- 예약 신청 스텝 인디케이터 클릭으로 단계 이동 가능
- 관리자 예약 관리에서 "거절"을 "취소"로 용어 변경
- 기기 가용성 계산 로직 개선 (시간대별 예약 고려)
- 기기 상태 "broken"을 "사용불가"로 표시 변경

### Fixed
- 관리자 예약 승인 시 UUID 타입 오류 수정
- 기기 현황 페이지 데이터 로딩 오류 수정
- 빌드 시 사용하지 않는 import 제거
- TypeScript 타입 오류 수정
- 관리자 예약 페이지 구문 오류 수정

### Improved
- 네비게이션 바와 상단 고정 헤더 겹침 문제 해결
- 기기 현황 카테고리별 탭 구성
- 관리자 설정 순서대로 기기 표시

## [0.9.0] - 2025-06-26

### Added
- 초기 프로젝트 구축
- Google OAuth 로그인 시스템
- 예약 신청 및 관리 시스템
- 관리자 대시보드
- 기기 관리 시스템
- 실시간 동기화 (Supabase Realtime)

### Changed
- 카카오톡 기반 예약에서 웹 기반 시스템으로 전환

### Security
- NextAuth.js 인증 시스템 구현
- Supabase Row Level Security (RLS) 적용

## [0.1.0] - 2025-06-20

### Added
- 프로젝트 초기 설정
- Next.js 14 App Router 구조
- Supabase 연동
- Tailwind CSS 설정

---

## Types of changes
- `Added` for new features.
- `Changed` for changes in existing functionality.
- `Deprecated` for soon-to-be removed features.
- `Removed` for now removed features.
- `Fixed` for any bug fixes.
- `Security` in case of vulnerabilities.