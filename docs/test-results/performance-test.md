# 게임플라자 성능 테스트 리포트

**테스트 일시**: 2025. 9. 13. 오후 8:51:08

## 📊 성능 테스트 요약

### Core Web Vitals 결과

| 측정 항목 | Desktop | Mobile | 목표 | 상태 |
|----------|---------|--------|------|------|
| LCP | N/A | N/A | < 2500ms | N/A |
| FCP | N/A | N/A | < 1800ms | N/A |
| TTI | N/A | N/A | < 3800ms | N/A |
| CLS | N/A | N/A | < 0.100 | N/A |

### API 엔드포인트 성능

| 엔드포인트 | 응답 시간 | 상태 | 평가 |
|------------|-----------|------|------|
| Home API | N/Ams | Error | ✅ 좋음 |
| Auth Check | N/Ams | Error | ✅ 좋음 |
| Time Slots | N/Ams | Error | ✅ 좋음 |
| Device Types | N/Ams | Error | ✅ 좋음 |

### 번들 사이즈 분석

번들 분석 실패: JavaScript build files not found

## 📋 상세 테스트 결과

### Desktop - 메인 페이지

- **로딩 시간**: 25692ms
- **디바이스**: Desktop
- **LCP**: N/A
- **FCP**: N/A
- **TTI**: N/A
- **CLS**: N/A
- **네트워크 요청**: 54개
- **평균 응답 시간**: 2059ms

### Mobile - 메인 페이지

- **로딩 시간**: 6719ms
- **디바이스**: undefined
- **LCP**: N/A
- **FCP**: N/A
- **TTI**: N/A
- **CLS**: N/A
- **네트워크 요청**: 26개
- **평균 응답 시간**: 273ms

### Mobile 3G - 메인 페이지

- **로딩 시간**: 9069ms
- **디바이스**: iPhone 12 (3G)

## 🚀 개선 권장사항

### 모바일 성능 최적화
모바일 환경에서 로딩 시간이 3초를 초과합니다.

- 모바일 우선 이미지 최적화
- Responsive image 사용
- Mobile viewport 최적화
- Touch 인터랙션 최적화

