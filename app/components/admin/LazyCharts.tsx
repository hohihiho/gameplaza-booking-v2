'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// 차트 컴포넌트 타입
type ChartComponent = ComponentType<any>;

// 차트 로딩 컴포넌트
const ChartLoader = () => (
  <div className="animate-pulse">
    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
  </div>
);

// Recharts 컴포넌트들을 동적 import
const createDynamicChart = (importFn: () => Promise<{ [key: string]: ChartComponent }>) => 
  dynamic(importFn, { 
    loading: ChartLoader,
    ssr: false 
  });

// 동적 차트 컴포넌트들
export const BarChart = createDynamicChart(() => 
  import('recharts').then(mod => ({ default: mod.BarChart }))
);

export const LineChart = createDynamicChart(() => 
  import('recharts').then(mod => ({ default: mod.LineChart }))
);

export const PieChart = createDynamicChart(() => 
  import('recharts').then(mod => ({ default: mod.PieChart }))
);

export const AreaChart = createDynamicChart(() => 
  import('recharts').then(mod => ({ default: mod.AreaChart }))
);

// 차트 구성 요소들도 동적으로 export
export { 
  Bar,
  Line,
  Pie,
  Area,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';