import type { Meta, StoryObj } from '@storybook/react';
import { DeviceSelector } from './DeviceSelector';
import { useState } from 'react';

// 스토리북용 래퍼 컴포넌트들 (React hooks 규칙 준수)
function DeviceSelectorWrapper(props: any) {
  const [selectedDevice, setSelectedDevice] = useState<string>();
  
  return (
    <div className="w-[800px]">
      <DeviceSelector
        {...props}
        selectedDeviceId={selectedDevice}
        onDeviceSelect={setSelectedDevice}
      />
      {selectedDevice && (
        <p className="mt-4 text-sm text-gray-600">
          선택된 기기 ID: {selectedDevice}
        </p>
      )}
    </div>
  );
}

function GroupByCategoryWrapper(props: any) {
  const [selectedDevice, setSelectedDevice] = useState<string>();
  
  return (
    <div className="w-[900px]">
      <DeviceSelector
        {...props}
        selectedDeviceId={selectedDevice}
        onDeviceSelect={setSelectedDevice}
      />
    </div>
  );
}

function SingleColumnWrapper(props: any) {
  const [selectedDevice, setSelectedDevice] = useState<string>();
  
  return (
    <div className="w-[400px]">
      <DeviceSelector
        {...props}
        selectedDeviceId={selectedDevice}
        onDeviceSelect={setSelectedDevice}
      />
    </div>
  );
}

function MobileWrapper(props: any) {
  const [selectedDevice, setSelectedDevice] = useState<string>();
  
  return (
    <div className="w-[320px] bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">기기 선택</h3>
      <DeviceSelector
        {...props}
        selectedDeviceId={selectedDevice}
        onDeviceSelect={setSelectedDevice}
      />
    </div>
  );
}

function DarkModeWrapper(props: any) {
  const [selectedDevice, setSelectedDevice] = useState<string>();
  
  return (
    <div className="dark bg-gray-900 p-8 rounded-lg">
      <div className="w-[800px]">
        <DeviceSelector
          {...props}
          selectedDeviceId={selectedDevice}
          onDeviceSelect={setSelectedDevice}
        />
      </div>
    </div>
  );
}

function CustomRenderWrapper(props: any) {
  const [selectedDevice, setSelectedDevice] = useState<string>();
  
  return (
    <div className="w-[900px]">
      <DeviceSelector
        {...props}
        selectedDeviceId={selectedDevice}
        onDeviceSelect={setSelectedDevice}
        renderDevice={(device, isSelected) => (
          <div
            key={device.id}
            onClick={() => setSelectedDevice(device.id)}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              isSelected
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-purple-300'
            } ${device.active_device_count === 0 ? 'opacity-50' : ''}`}
          >
            <h4 className="font-bold">{device.name}</h4>
            <p className="text-sm text-gray-600">{device.category}</p>
            <div className="mt-2 flex justify-between items-center">
              <span className="text-xs">{device.active_device_count}대 가능</span>
              {device.requires_approval && (
                <span className="text-xs text-orange-600">승인 필요</span>
              )}
            </div>
          </div>
        )}
      />
    </div>
  );
}

const meta = {
  title: 'UI/DeviceSelector',
  component: DeviceSelector,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    columns: {
      description: '그리드 컬럼 수 설정',
      control: 'object',
    },
    groupByCategory: {
      description: '카테고리별 그룹핑 여부',
      control: 'boolean',
    },
    isLoading: {
      description: '로딩 상태',
      control: 'boolean',
    },
    error: {
      description: '에러 메시지',
      control: 'text',
    },
  },
} satisfies Meta<typeof DeviceSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

// 샘플 기기 데이터
const sampleDevices = [
  {
    id: '1',
    name: 'TEKKEN 8',
    category: 'NAMCO 게임기',
    model_name: 'NOIR VEWLIX',
    version_name: 'Latest Version',
    requires_approval: false,
    active_device_count: 2,
    total_device_count: 2,
    max_players: 2,
  },
  {
    id: '2',
    name: '스트리트 파이터 6',
    category: 'CAPCOM 게임기',
    model_name: 'Vewlix Diamond Blue',
    requires_approval: false,
    active_device_count: 1,
    total_device_count: 2,
  },
  {
    id: '3',
    name: 'GUILTY GEAR -STRIVE-',
    category: 'SNK 게임기',
    model_name: 'VEWLIX',
    requires_approval: true,
    active_device_count: 3,
    total_device_count: 3,
  },
  {
    id: '4',
    name: 'Beatmania IIDX 31 EPOLIS',
    category: 'KONAMI 게임기',
    model_name: 'Lightning Model',
    requires_approval: false,
    active_device_count: 0,
    total_device_count: 1,
  },
  {
    id: '5',
    name: '버추어 파이터 5',
    category: 'SEGA 게임기',
    model_name: 'Lindbergh',
    requires_approval: false,
    active_device_count: 1,
    total_device_count: 1,
  },
  {
    id: '6',
    name: '더 킹 오브 파이터즈 XV',
    category: 'SNK 게임기',
    model_name: 'MVS',
    requires_approval: false,
    active_device_count: 2,
    total_device_count: 2,
    max_players: 2,
  },
];

// 기본 기기 선택기
export const Default: Story = {
  args: {
    deviceTypes: sampleDevices,
    columns: { mobile: 1, tablet: 2, desktop: 2 },
  },
  render: (args) => <DeviceSelectorWrapper {...args} />,
};

// 카테고리별 그룹핑
export const GroupByCategory: Story = {
  args: {
    deviceTypes: sampleDevices,
    groupByCategory: true,
    columns: { mobile: 1, tablet: 2, desktop: 3 },
  },
  render: (args) => <GroupByCategoryWrapper {...args} />,
};

// 로딩 상태
export const Loading: Story = {
  args: {
    deviceTypes: [],
    isLoading: true,
    columns: { mobile: 1, tablet: 2, desktop: 2 },
  },
};

// 에러 상태
export const Error: Story = {
  args: {
    deviceTypes: [],
    error: '기기 정보를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  },
};

// 빈 상태
export const Empty: Story = {
  args: {
    deviceTypes: [],
    emptyMessage: '현재 예약 가능한 기기가 없습니다',
  },
};

// 단일 컬럼 레이아웃
export const SingleColumn: Story = {
  args: {
    deviceTypes: sampleDevices.slice(0, 3),
    columns: { mobile: 1, tablet: 1, desktop: 1 },
  },
  render: (args) => <SingleColumnWrapper {...args} />,
};

// 모바일 뷰
export const Mobile: Story = {
  args: {
    deviceTypes: sampleDevices.slice(0, 4),
    columns: { mobile: 1, tablet: 2, desktop: 2 },
  },
  render: (args) => <MobileWrapper {...args} />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// 다크 모드
export const DarkMode: Story = {
  args: {
    deviceTypes: sampleDevices,
    columns: { mobile: 1, tablet: 2, desktop: 2 },
  },
  render: (args) => <DarkModeWrapper {...args} />,
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

// 커스텀 렌더링
export const CustomRender: Story = {
  args: {
    deviceTypes: sampleDevices,
    columns: { mobile: 1, tablet: 2, desktop: 3 },
  },
  render: (args) => <CustomRenderWrapper {...args} />,
};