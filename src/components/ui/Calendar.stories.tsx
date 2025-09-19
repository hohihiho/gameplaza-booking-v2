import type { Meta, StoryObj } from '@storybook/react';
import { Calendar } from './Calendar';
import { useState } from 'react';

// 스토리북용 래퍼 컴포넌트들 (React hooks 규칙 준수)
function CalendarWrapper(props: any) {
  const [selectedDate, setSelectedDate] = useState<string>();
  
  return (
    <div className="w-[350px]">
      <Calendar
        {...props}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />
      {selectedDate && (
        <p className="mt-4 text-sm text-gray-600">
          선택된 날짜: {selectedDate}
        </p>
      )}
    </div>
  );
}

function DateRangeWrapper(props: any) {
  const [selectedDate, setSelectedDate] = useState<string>();
  
  // 오늘부터 30일까지만 선택 가능
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 30);
  
  return (
    <div className="w-[350px]">
      <Calendar
        {...props}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        minDate={today}
        maxDate={maxDate}
      />
      <p className="mt-4 text-sm text-gray-600">
        오늘부터 30일 이내만 선택 가능
      </p>
    </div>
  );
}

function DateMarksWrapper(props: any) {
  const [selectedDate, setSelectedDate] = useState<string>();
  
  return (
    <div className="w-[350px]">
      <Calendar
        {...props}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span>예약 가능</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-amber-500 rounded-full" />
          <span>일부 시간대 가능</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <span>예약 마감</span>
        </div>
      </div>
    </div>
  );
}

function CustomDisabledWrapper(props: any) {
  const [selectedDate, setSelectedDate] = useState<string>();
  
  // 주말과 특정 날짜 비활성화
  const isDateDisabled = (date: Date) => {
    const day = date.getDay();
    const dateStr = date.toISOString().split('T')[0];
    
    // 주말 비활성화
    if (day === 0 || day === 6) return true;
    
    // 특정 날짜 비활성화 (공휴일 등)
    const holidays = ['2025-07-15', '2025-07-20'];
    if (holidays.includes(dateStr)) return true;
    
    // 오늘 이전 날짜 비활성화
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    
    return false;
  };
  
  return (
    <div className="w-[350px]">
      <Calendar
        {...props}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        isDateDisabled={isDateDisabled}
      />
      <p className="mt-4 text-sm text-gray-600">
        주말과 공휴일은 선택 불가
      </p>
    </div>
  );
}

function MultipleMonthsWrapper(props: any) {
  const [selectedDate, setSelectedDate] = useState<string>();
  
  return (
    <div className="w-[700px]">
      <Calendar
        {...props}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />
    </div>
  );
}

function MobileWrapper(props: any) {
  const [selectedDate, setSelectedDate] = useState<string>();
  
  return (
    <div className="w-[320px] bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">날짜 선택</h3>
      <Calendar
        {...props}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        className="bg-white rounded-lg shadow-sm"
      />
      <p className="mt-4 text-sm text-gray-500 text-center">
        ← 좌우로 스와이프하여 월 이동 →
      </p>
    </div>
  );
}

function DarkModeWrapper(props: any) {
  const [selectedDate, setSelectedDate] = useState<string>();
  
  return (
    <div className="dark bg-gray-900 p-8 rounded-lg">
      <div className="w-[350px]">
        <Calendar
          {...props}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
      </div>
    </div>
  );
}

const meta = {
  title: 'UI/Calendar',
  component: Calendar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    selectedDate: {
      description: '선택된 날짜 (YYYY-MM-DD 형식)',
      control: 'text',
    },
    monthsToShow: {
      description: '표시할 월 수',
      control: { type: 'number', min: 1, max: 12 },
    },
    enableSwipe: {
      description: '모바일 스와이프 지원 여부',
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 캘린더
export const Default: Story = {
  args: {
    monthsToShow: 1,
    enableSwipe: true,
  },
  render: (args) => <CalendarWrapper {...args} />,
};

// 날짜 범위 제한
export const WithDateRange: Story = {
  args: {
    monthsToShow: 1,
    enableSwipe: true,
  },
  render: (args) => <DateRangeWrapper {...args} />,
};

// 예약 가능 날짜 표시
export const WithDateMarks: Story = {
  args: {
    monthsToShow: 1,
    enableSwipe: true,
    dateMarks: {
      '2025-07-15': { color: '#10b981', tooltip: '예약 가능' },
      '2025-07-16': { color: '#10b981', tooltip: '예약 가능' },
      '2025-07-17': { color: '#ef4444', tooltip: '예약 마감' },
      '2025-07-20': { color: '#f59e0b', tooltip: '일부 시간대 가능' },
      '2025-07-25': { color: '#10b981', tooltip: '예약 가능' },
    },
  },
  render: (args) => <DateMarksWrapper {...args} />,
};

// 커스텀 날짜 비활성화
export const WithCustomDisabledDates: Story = {
  args: {
    monthsToShow: 1,
    enableSwipe: true,
  },
  render: (args) => <CustomDisabledWrapper {...args} />,
};

// 여러 달 표시
export const MultipleMonths: Story = {
  args: {
    monthsToShow: 2,
    enableSwipe: false,
  },
  render: (args) => <MultipleMonthsWrapper {...args} />,
};

// 모바일 뷰
export const Mobile: Story = {
  args: {
    monthsToShow: 1,
    enableSwipe: true,
  },
  render: (args) => <MobileWrapper {...args} />,
};

// 다크 모드
export const DarkMode: Story = {
  args: {
    monthsToShow: 1,
    enableSwipe: true,
  },
  render: (args) => <DarkModeWrapper {...args} />,
  parameters: {
    backgrounds: { default: 'dark' },
  },
};