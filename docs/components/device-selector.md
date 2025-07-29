# DeviceSelector 컴포넌트

## 개요
`DeviceSelector`는 예약 가능한 기기들을 그리드 형태로 표시하고 선택할 수 있게 해주는 UI 컴포넌트입니다. 게임플라자 예약 시스템에서 기기 선택 단계에 사용됩니다.

## 주요 기능
- 🎮 기기 목록 그리드 표시
- ✅ 기기 선택/해제
- 📱 반응형 그리드 레이아웃
- 🏷️ 카테고리별 그룹핑
- 🔄 로딩 상태 표시
- ⚠️ 에러 처리
- 🎨 커스텀 렌더링 지원
- ♿ 접근성 지원

## 사용법

### 기본 사용
```tsx
import { DeviceSelector } from '@/src/components/ui/DeviceSelector';

function MyComponent() {
  const [selectedDevice, setSelectedDevice] = useState<string>();
  const [devices, setDevices] = useState<DeviceType[]>([]);
  
  return (
    <DeviceSelector
      deviceTypes={devices}
      selectedDeviceId={selectedDevice}
      onDeviceSelect={setSelectedDevice}
    />
  );
}
```

### 반응형 그리드 설정
```tsx
<DeviceSelector
  deviceTypes={devices}
  selectedDeviceId={selectedDevice}
  onDeviceSelect={setSelectedDevice}
  columns={{
    mobile: 1,   // 모바일: 1열
    tablet: 2,   // 태블릿: 2열
    desktop: 3   // 데스크톱: 3열
  }}
/>
```

### 카테고리별 그룹핑
```tsx
<DeviceSelector
  deviceTypes={devices}
  selectedDeviceId={selectedDevice}
  onDeviceSelect={setSelectedDevice}
  groupByCategory={true}
/>
```

### 로딩 및 에러 상태
```tsx
// 로딩 상태
<DeviceSelector
  deviceTypes={[]}
  isLoading={true}
/>

// 에러 상태
<DeviceSelector
  deviceTypes={[]}
  error="기기 정보를 불러올 수 없습니다"
/>
```

### 커스텀 렌더링
```tsx
<DeviceSelector
  deviceTypes={devices}
  selectedDeviceId={selectedDevice}
  onDeviceSelect={setSelectedDevice}
  renderDevice={(device, isSelected) => (
    <CustomDeviceCard
      device={device}
      isSelected={isSelected}
      onClick={() => setSelectedDevice(device.id)}
    />
  )}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `deviceTypes` | `DeviceType[]` | - | 표시할 기기 목록 |
| `selectedDeviceId` | `string` | - | 선택된 기기 ID |
| `onDeviceSelect` | `(deviceId: string) => void` | - | 기기 선택 콜백 |
| `columns` | `{ mobile?: number; tablet?: number; desktop?: number }` | `{ mobile: 1, tablet: 2, desktop: 2 }` | 반응형 그리드 컬럼 수 |
| `isLoading` | `boolean` | false | 로딩 상태 |
| `error` | `string \| null` | null | 에러 메시지 |
| `renderDevice` | `(device: DeviceType, isSelected: boolean) => ReactNode` | - | 커스텀 기기 렌더링 |
| `emptyMessage` | `string` | '이용 가능한 기기가 없습니다' | 빈 상태 메시지 |
| `groupByCategory` | `boolean` | false | 카테고리별 그룹핑 여부 |
| `className` | `string` | '' | 추가 CSS 클래스 |

## DeviceType 인터페이스

```typescript
interface DeviceType {
  id: string;
  name: string;
  category: string;
  description?: string;
  model_name?: string;
  version_name?: string;
  requires_approval: boolean;
  image_url?: string;
  active_device_count: number;
  total_device_count: number;
  max_rental_units?: number;
  max_players?: number;
  price_multiplier_2p?: number;
  rental_settings?: any;
}
```

## 스타일링

### 기본 스타일
- 선택된 기기: 인디고 테두리와 배경
- 사용 가능한 기기: 회색 테두리, 호버 시 진한 테두리
- 사용 불가능한 기기: 50% 투명도, 비활성화 커서
- 승인 필요 배지: 주황색 배경

### 상태별 색상
- 사용 가능: 초록색 배지
- 예약 불가: 빨간색 배지
- 2인 플레이 가능: 파란색 배지
- 승인 필요: 주황색 배지

## 접근성
- 키보드 탭 네비게이션 지원
- 버튼 역할과 상태 ARIA 속성
- 비활성화 상태 명확한 표시
- 포커스 인디케이터

## 성능 고려사항
- 많은 기기 목록에서도 빠른 렌더링
- 애니메이션은 CSS 트랜지션 사용
- 조건부 렌더링으로 불필요한 DOM 생성 방지

## 예제

### 예약 페이지에서 사용
```tsx
function ReservationDeviceStep() {
  const [selectedDevice, setSelectedDevice] = useState<string>();
  const [devices, setDevices] = useState<DeviceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchAvailableDevices()
      .then(setDevices)
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);
  
  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDevice(deviceId);
    // 다음 단계로 이동
    goToNextStep();
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">기기를 선택해주세요</h2>
      <DeviceSelector
        deviceTypes={devices}
        selectedDeviceId={selectedDevice}
        onDeviceSelect={handleDeviceSelect}
        isLoading={isLoading}
        error={error}
        columns={{ mobile: 1, tablet: 2, desktop: 3 }}
        groupByCategory={true}
      />
    </div>
  );
}
```

### 관리자 페이지에서 사용
```tsx
function AdminDeviceManager() {
  const [devices, setDevices] = useState<DeviceType[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  
  const toggleDevice = (deviceId: string) => {
    const newSelected = new Set(selectedDevices);
    if (newSelected.has(deviceId)) {
      newSelected.delete(deviceId);
    } else {
      newSelected.add(deviceId);
    }
    setSelectedDevices(newSelected);
  };
  
  return (
    <DeviceSelector
      deviceTypes={devices}
      selectedDeviceId={Array.from(selectedDevices)[0]} // 첫 번째 선택된 것만 표시
      onDeviceSelect={toggleDevice}
      renderDevice={(device, isSelected) => (
        <div
          key={device.id}
          onClick={() => toggleDevice(device.id)}
          className={`p-4 rounded-lg border-2 cursor-pointer ${
            selectedDevices.has(device.id)
              ? 'border-indigo-600 bg-indigo-50'
              : 'border-gray-200'
          }`}
        >
          <input
            type="checkbox"
            checked={selectedDevices.has(device.id)}
            onChange={() => {}}
            className="float-right"
          />
          <h3 className="font-bold">{device.name}</h3>
          <p className="text-sm text-gray-600">{device.category}</p>
          <p className="text-xs mt-2">
            {device.active_device_count}/{device.total_device_count} 사용 가능
          </p>
        </div>
      )}
    />
  );
}
```

## 테스트
DeviceSelector 컴포넌트는 다음과 같은 테스트 케이스를 포함합니다:
- 기기 목록 렌더링
- 기기 선택/해제
- 선택 상태 표시
- 비활성화 상태
- 로딩/에러/빈 상태
- 카테고리 그룹핑
- 커스텀 렌더링

테스트 실행:
```bash
npm test src/components/ui/__tests__/DeviceSelector.test.tsx
```