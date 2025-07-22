# 🔗 기획서 상호 참조 가이드

## 📋 기능별 문서 매핑

### 🕐 시간 관련 기능
| 기능 | 주요 문서 | 보조 문서 |
|------|-----------|-----------|
| KST 타임존 처리 | [시간대 시스템](./time_slot_system.md) | [통합 기획서](./complete_specification.md#핵심-특징) |
| 24시간 표시 체계 | [시간대 시스템](./time_slot_system.md#시간-표시-규칙) | [예약 시스템](./device_number_reservation.md) |
| 영업일 6시 리셋 | [통합 기획서](./complete_specification.md) | [관리자 플로우](./admin_flow.md) |
| 시간 조정 기능 | [시간 조정 구현](./time_adjustment_implementation_plan.md) | [관리자 플로우](./admin_flow.md) |

### 🎮 기기 관리
| 기능 | 주요 문서 | 보조 문서 |
|------|-----------|-----------|
| 기기 계층 구조 | [통합 기획서](./complete_specification.md#기기-관리-시스템) | [운영 인사이트](./operation_insights.md) |
| 기기 번호 예약 | [기기 예약 시스템](./device_number_reservation.md) | [사용자 플로우](./user_flow.md) |
| 기기 상태 관리 | [통합 기획서](./complete_specification.md) | [관리자 플로우](./admin_flow.md) |
| 대여 가격 설정 | [시간대 시스템](./time_slot_system.md) | [운영 인사이트](./operation_insights.md) |

### 📅 예약 프로세스
| 기능 | 주요 문서 | 보조 문서 |
|------|-----------|-----------|
| 예약 신청 플로우 | [사용자 플로우](./user_flow.md) | [기기 예약 시스템](./device_number_reservation.md) |
| 예약 승인/거절 | [관리자 플로우](./admin_flow.md) | [통합 기획서](./complete_specification.md) |
| 체크인 프로세스 | [관리자 플로우](./admin_flow.md#체크인-관리-플로우) | [시간 조정](./time_adjustment_implementation_plan.md) |
| 예약 제한 규칙 | [기기 예약 시스템](./device_number_reservation.md#예약-제한-규칙) | [통합 기획서](./complete_specification.md) |

### 👤 사용자 경험
| 기능 | 주요 문서 | 보조 문서 |
|------|-----------|-----------|
| 회원가입/로그인 | [사용자 플로우](./user_flow.md#회원가입-플로우) | [통합 기획서](./complete_specification.md) |
| 마이페이지 | [사용자 플로우](./user_flow.md#마이페이지) | [디자인 가이드](./design_guide.md) |
| 모바일 UX | [디자인 가이드](./design_guide.md) | [와이어프레임](./wireframes_collection.md) |
| 사용 가이드 | [사용 가이드 콘텐츠](./usage_guide_content.md) | [사용자 플로우](./user_flow.md) |

### 💰 결제 및 요금
| 기능 | 주요 문서 | 보조 문서 |
|------|-----------|-----------|
| 결제 프로세스 | [관리자 플로우](./admin_flow.md#체크인-관리-플로우) | [통합 기획서](./complete_specification.md) |
| 크레딧 타입 | [시간대 시스템](./time_slot_system.md#크레딧-타입별-가격-설정) | [통합 기획서](./complete_specification.md) |
| 계좌번호 관리 | [통합 기획서](./complete_specification.md) | [관리자 플로우](./admin_flow.md) |
| 금액 조정 | [시간 조정 구현](./time_adjustment_implementation_plan.md) | [관리자 플로우](./admin_flow.md) |

### 📊 운영 및 통계
| 기능 | 주요 문서 | 보조 문서 |
|------|-----------|-----------|
| 대시보드 | [관리자 플로우](./admin_flow.md#관리자-메인-대시보드) | [통합 기획서](./complete_specification.md) |
| 통계 분석 | [통합 기획서](./complete_specification.md) | [운영 인사이트](./operation_insights.md) |
| 운영 일정 관리 | [통합 기획서](./complete_specification.md#운영-일정-관리) | [시간대 시스템](./time_slot_system.md) |
| 실시간 동기화 | [통합 기획서](./complete_specification.md) | [MVP 개발 계획](./mvp_development_plan.md) |

## 🔍 주요 키워드별 문서 위치

### 기술 구현 관련
- **PWA**: [통합 기획서](./complete_specification.md), [MVP 개발 계획](./mvp_development_plan.md)
- **Supabase**: [통합 기획서](./complete_specification.md#기술-스택), [MVP 개발 계획](./mvp_development_plan.md)
- **실시간 동기화**: [통합 기획서](./complete_specification.md), [운영 인사이트](./operation_insights.md)
- **AI 필터링**: [통합 기획서](./complete_specification.md#핵심-특징)

### 비즈니스 로직
- **24시간 룰**: [기기 예약 시스템](./device_number_reservation.md), [사용자 플로우](./user_flow.md)
- **1인 1대 원칙**: [기기 예약 시스템](./device_number_reservation.md#1인-1대-원칙)
- **마이마이 2P**: [통합 기획서](./complete_specification.md), [시간대 시스템](./time_slot_system.md)
- **노쇼 처리**: [관리자 플로우](./admin_flow.md), [통합 기획서](./complete_specification.md)

### UI/UX 관련
- **모바일 퍼스트**: [디자인 가이드](./design_guide.md), [통합 기획서](./complete_specification.md)
- **다크모드**: [디자인 가이드](./design_guide.md)
- **와이어프레임**: [와이어프레임 모음](./wireframes_collection.md)
- **반응형 디자인**: [디자인 가이드](./design_guide.md), [와이어프레임](./wireframes_collection.md)

## 📝 문서 업데이트 체크리스트

문서 수정 시 다음 관련 문서들도 함께 확인하세요:

### 시간 관련 변경 시
- [ ] [시간대 시스템](./time_slot_system.md) 업데이트
- [ ] [통합 기획서](./complete_specification.md) 시간 섹션 확인
- [ ] [관리자 플로우](./admin_flow.md) 운영 시간 부분 확인

### 기기 관리 변경 시
- [ ] [기기 예약 시스템](./device_number_reservation.md) 업데이트
- [ ] [통합 기획서](./complete_specification.md) 기기 관리 섹션 확인
- [ ] [관리자 플로우](./admin_flow.md) 기기 관리 부분 확인

### 예약 프로세스 변경 시
- [ ] [사용자 플로우](./user_flow.md) 예약 부분 업데이트
- [ ] [기기 예약 시스템](./device_number_reservation.md) 확인
- [ ] [관리자 플로우](./admin_flow.md) 예약 관리 부분 확인

### UI/UX 변경 시
- [ ] [디자인 가이드](./design_guide.md) 업데이트
- [ ] [와이어프레임](./wireframes_collection.md) 수정
- [ ] [사용 가이드 콘텐츠](./usage_guide_content.md) 확인

---

💡 **팁**: 문서 수정 시 이 상호 참조 가이드를 활용하여 모든 관련 문서가 일관성을 유지하도록 하세요.