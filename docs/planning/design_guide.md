# 광주 게임플라자 디자인 시스템 가이드

## 🎨 디자인 철학

### 핵심 원칙
- **자연스러움**: AI스럽지 않은, 인간적인 느낌
- **실용성**: 사용하기 편한 직관적 UI/UX
- **모던함**: 요즘 트렌드에 맞는 세련된 디자인
- **차별화**: 뻔한 아케이드 스타일 지양

### 지향점
✅ 카카오맵, 네이버 예약 같은 실용적 앱
✅ 토스, 뱅크샐러드 같은 깔끔한 UI
✅ 배달의민족 사장님 앱 같은 관리 도구

### 지양점
❌ "안녕하세요! 저는 AI 어시스턴트입니다" 같은 로봇적 멘트
❌ 네온사인, 8비트 폰트, 형광색 아케이드 스타일
❌ 과도한 게임 이펙트나 애니메이션

---

## 🎯 타이포그래피

### 폰트 시스템

#### 주요 폰트
```css
/* 영어 로고용 */
font-family: 'Orbitron', monospace;
/* 사용: GAMEPLAZA 로고, 영문 브랜딩 */

/* 한글 본문용 */
font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
/* 사용: 모든 한글 텍스트, UI 요소 */
```

#### 폰트 조합 예시
```
GAMEPLAZA 게임플라자
[Orbitron]  [Pretendard]
```

### 폰트 크기 스케일
```css
/* 모바일 기준 (Tailwind 클래스) */
text-xs    /* 12px - 캡션, 부연설명 */
text-sm    /* 14px - 보조 텍스트 */
text-base  /* 16px - 기본 본문 */
text-lg    /* 18px - 중요 텍스트 */
text-xl    /* 20px - 소제목 */
text-2xl   /* 24px - 제목 */
text-3xl   /* 30px - 메인 제목 */
text-4xl   /* 36px - 로고, 히어로 */
```

---

## 🎨 컬러 시스템

### 주요 컬러 팔레트

#### Primary (주색상)
```css
/* 블루 계열 - 신뢰감, 전문성 */
--primary-50:  #eff6ff   /* 배경 */
--primary-100: #dbeafe   /* 연한 배경 */
--primary-500: #3b82f6   /* 기본 */
--primary-600: #2563eb   /* 호버 */
--primary-700: #1d4ed8   /* 액티브 */
--primary-900: #1e3a8a   /* 진한 텍스트 */
```

#### Secondary (보조색상)
```css
/* 그레이 계열 - 균형감, 모던함 */
--gray-50:  #f9fafb
--gray-100: #f3f4f6
--gray-200: #e5e7eb
--gray-300: #d1d5db
--gray-500: #6b7280
--gray-700: #374151
--gray-900: #111827
```

#### Accent (포인트 컬러)
```css
/* 상황별 포인트 색상 */
--success: #10b981  /* 성공, 승인 */
--warning: #f59e0b  /* 주의, 대기 */
--error:   #ef4444  /* 오류, 거절 */
--info:    #3b82f6  /* 정보, 알림 */
```

---

## 🧩 컴포넌트 스타일

### 버튼
```css
/* 기본 버튼 */
.btn-primary {
  background: #3b82f6;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
}
```

### 카드
```css
.card {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}
```

---

## 💬 톤앤매너

### 텍스트 스타일

#### ✅ 좋은 예시
```
"예약이 완료되었습니다"
"관리자 승인을 기다리고 있어요"
"계좌번호가 복사되었습니다"
"예약 시간 1시간 전입니다"
```

#### ❌ 피해야 할 예시
```
"안녕하세요! 저는 AI 어시스턴트입니다"
"놀라운 기능을 경험해보세요!"
"혁신적인 예약 시스템"
"인공지능이 도와드립니다"
```

---

**디자인 철학**: "사용자가 도구를 의식하지 않고 목적에 집중할 수 있는 자연스러운 인터페이스"

**최종 목표**: 리듬게임 오락실 예약이라는 특수한 도메인에 최적화되면서도, 누구나 쉽게 사용할 수 있는 직관적인 서비스