# Calendar 컴포넌트

## 개요
`Calendar`는 날짜를 선택할 수 있는 캘린더 UI 컴포넌트입니다. 예약 시스템에서 날짜 선택, 일정 관리 등 다양한 용도로 사용됩니다.

## 주요 기능
- 📅 월별 날짜 표시 및 선택
- 🔄 이전/다음 월 네비게이션
- 📱 모바일 스와이프 지원
- 🎨 날짜별 마크 표시
- ⚙️ 커스텀 날짜 비활성화
- 🌓 다크모드 지원
- ♿ 접근성 지원

## 사용법

### 기본 사용
```tsx
import { Calendar } from '@/src/components/ui/Calendar';

function MyComponent() {
  const [selectedDate, setSelectedDate] = useState<string>();
  
  return (
    <Calendar
      selectedDate={selectedDate}
      onDateSelect={setSelectedDate}
    />
  );
}
```

### 날짜 범위 제한
```tsx
<Calendar
  selectedDate={selectedDate}
  onDateSelect={setSelectedDate}
  minDate={new Date()} // 오늘부터
  maxDate={new Date(2025, 11, 31)} // 2025년 12월 31일까지
/>
```

### 특정 날짜 비활성화
```tsx
<Calendar
  selectedDate={selectedDate}
  onDateSelect={setSelectedDate}
  isDateDisabled={(date) => {
    // 주말 비활성화
    const day = date.getDay();
    return day === 0 || day === 6;
  }}
/>
```

### 날짜별 마크 표시
```tsx
<Calendar
  selectedDate={selectedDate}
  onDateSelect={setSelectedDate}
  dateMarks={{
    '2025-07-15': { color: '#10b981', tooltip: '예약 가능' },
    '2025-07-16': { color: '#ef4444', tooltip: '예약 마감' },
  }}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `selectedDate` | `string` | - | 선택된 날짜 (YYYY-MM-DD 형식) |
| `onDateSelect` | `(date: string) => void` | - | 날짜 선택 콜백 |
| `isDateDisabled` | `(date: Date) => boolean` | - | 날짜 비활성화 판별 함수 |
| `minDate` | `Date` | - | 최소 선택 가능 날짜 |
| `maxDate` | `Date` | - | 최대 선택 가능 날짜 |
| `monthsToShow` | `number` | 1 | 표시할 월 수 |
| `enableSwipe` | `boolean` | true | 모바일 스와이프 지원 여부 |
| `renderDate` | `(date: Date, isSelected: boolean, isDisabled: boolean) => ReactNode` | - | 커스텀 날짜 렌더링 |
| `dateMarks` | `Record<string, { color: string; tooltip?: string }>` | {} | 날짜별 표시 마크 |
| `className` | `string` | '' | 추가 CSS 클래스 |

## 스타일링

### 기본 스타일
캘린더는 다음과 같은 기본 스타일을 가집니다:
- 선택된 날짜: 인디고 배경색
- 오늘 날짜: 인디고 테두리
- 비활성 날짜: 회색 배경, 50% 투명도
- 주말: 일요일(빨강), 토요일(파랑)

### 커스터마이징
`className` prop을 통해 추가 스타일을 적용할 수 있습니다:

```tsx
<Calendar
  className="bg-white rounded-lg shadow-lg p-4"
  // ...
/>
```

## 접근성
- 키보드 네비게이션 지원 (Tab, Arrow keys)
- ARIA 라벨 제공
- 스크린 리더 호환
- 비활성 날짜에 대한 명확한 표시

## 모바일 최적화
- 터치 친화적인 크기 (최소 44x44px)
- 스와이프 제스처로 월 이동
- 반응형 그리드 레이아웃

## 성능 고려사항
- `useMemo`를 사용한 날짜 계산 최적화
- 불필요한 리렌더링 방지
- 큰 날짜 범위에서도 빠른 성능

## 예제

### 예약 시스템에서 사용
```tsx
function ReservationDatePicker() {
  const [selectedDate, setSelectedDate] = useState<string>();
  const [availableDates, setAvailableDates] = useState<Record<string, boolean>>({});
  
  // 예약 가능한 날짜 조회
  useEffect(() => {
    fetchAvailableDates().then(setAvailableDates);
  }, []);
  
  return (
    <Calendar
      selectedDate={selectedDate}
      onDateSelect={setSelectedDate}
      isDateDisabled={(date) => {
        const dateStr = formatKSTDate(date);
        return !availableDates[dateStr];
      }}
      dateMarks={Object.entries(availableDates).reduce((marks, [date, available]) => {
        marks[date] = {
          color: available ? '#10b981' : '#ef4444',
          tooltip: available ? '예약 가능' : '예약 마감'
        };
        return marks;
      }, {})}
    />
  );
}
```

### 일정 관리에서 사용
```tsx
function ScheduleCalendar() {
  const [selectedDate, setSelectedDate] = useState<string>();
  const [events, setEvents] = useState<Record<string, Event[]>>({});
  
  return (
    <Calendar
      selectedDate={selectedDate}
      onDateSelect={setSelectedDate}
      renderDate={(date, isSelected, isDisabled) => {
        const dateStr = formatKSTDate(date);
        const dayEvents = events[dateStr] || [];
        
        return (
          <div className="relative w-full h-full p-1">
            <span className={isSelected ? 'text-white' : ''}>
              {date.getDate()}
            </span>
            {dayEvents.length > 0 && (
              <div className="absolute bottom-1 left-1 right-1">
                <div className="text-xs text-center">
                  {dayEvents.length}개
                </div>
              </div>
            )}
          </div>
        );
      }}
    />
  );
}
```

## 테스트
Calendar 컴포넌트는 다음과 같은 테스트 케이스를 포함합니다:
- 기본 렌더링
- 날짜 선택
- 네비게이션
- 날짜 비활성화
- 마크 표시
- 접근성

테스트 실행:
```bash
npm test src/components/ui/__tests__/Calendar.test.tsx
```