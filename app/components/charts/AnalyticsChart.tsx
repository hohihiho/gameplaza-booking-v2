// 통계 차트 공통 컴포넌트
// 비전공자 설명: 여러 페이지에서 재사용할 수 있는 차트 컴포넌트입니다
'use client';

// recharts는 사용하는 곳에서 동적으로 import
import { ResponsiveContainer } from '@/app/components/charts/LazyRecharts';
import { useTheme } from '@/app/components/ThemeProvider';

// 다크모드 대응 색상
export const chartColors = {
  primary: '#3B82F6', // blue-500
  secondary: '#8B5CF6', // purple-500
  success: '#10B981', // green-500
  warning: '#F59E0B', // yellow-500
  danger: '#EF4444', // red-500
  gray: '#6B7280', // gray-500
  
  // 그라데이션용
  primaryGradient: ['#3B82F6', '#8B5CF6'],
  secondaryGradient: ['#8B5CF6', '#EC4899']
};

// 차트 공통 설정
export const commonChartProps = {
  margin: { top: 5, right: 30, left: 20, bottom: 5 }
};

// 커스텀 툴팁 컴포넌트
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: number) => string;
}

export const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  const { theme } = useTheme();
  
  if (!active || !payload || !payload.length) return null;

  return (
    <div className={`p-3 rounded-lg shadow-lg border ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <p className={`text-sm font-medium mb-1 ${
        theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
      }`}>
        {label}
      </p>
      {payload.map((entry, index) => (
        <p 
          key={index} 
          className="text-sm"
          style={{ color: entry.color }}
        >
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
};

// 차트 축 스타일
export const getAxisStyle = (theme: string) => ({
  fontSize: 12,
  fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' // gray-400 : gray-500
});

// 그리드 스타일
export const getGridStyle = (theme: string) => ({
  stroke: theme === 'dark' ? '#374151' : '#E5E7EB', // gray-700 : gray-200
  strokeDasharray: '3 3'
});

// 범례 스타일
export const getLegendStyle = (theme: string) => ({
  fontSize: 12,
  fill: theme === 'dark' ? '#D1D5DB' : '#4B5563' // gray-300 : gray-700
});

// 반응형 차트 래퍼
interface ChartWrapperProps {
  children: React.ReactNode;
  height?: number;
}

export const ChartWrapper = ({ children, height = 300 }: ChartWrapperProps) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      {children}
    </ResponsiveContainer>
  );
};

// 데이터 포맷터
export const formatters = {
  // 숫자 포맷 (천 단위 콤마)
  number: (value: number) => value.toLocaleString(),
  
  // 퍼센트 포맷
  percent: (value: number) => `${value}%`,
  
  // 금액 포맷
  currency: (value: number) => `${value.toLocaleString()}원`,
  
  // 시간 포맷 (24시간 표시)
  hour: (hour: number) => {
    if (hour >= 24) return `${hour}시`; // 밤샘 시간대
    return `${hour}시`;
  },
  
  // 날짜 포맷
  date: (date: string) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
};

// 모바일 체크
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

// 차트 애니메이션 설정
export const chartAnimation = {
  duration: 1000,
  easing: 'ease-out' as const
};