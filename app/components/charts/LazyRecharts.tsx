'use client';

import dynamic from 'next/dynamic';

// 로딩 중 표시할 스켈레톤
const ChartSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-full bg-gray-200 dark:bg-gray-700 rounded"></div>
  </div>
);

// Recharts 컴포넌트들을 동적으로 import
export const BarChart = dynamic(
  () => import('recharts').then(mod => mod.BarChart),
  { loading: () => <ChartSkeleton />, ssr: false }
) as any;

export const LineChart = dynamic(
  () => import('recharts').then(mod => mod.LineChart),
  { loading: () => <ChartSkeleton />, ssr: false }
) as any;

export const PieChart = dynamic(
  () => import('recharts').then(mod => mod.PieChart),
  { loading: () => <ChartSkeleton />, ssr: false }
) as any;

export const AreaChart = dynamic(
  () => import('recharts').then(mod => mod.AreaChart),
  { loading: () => <ChartSkeleton />, ssr: false }
) as any;

// 차트 구성 요소들
export const Bar = dynamic(
  () => import('recharts').then(mod => mod.Bar),
  { ssr: false }
) as any;

export const Line = dynamic(
  () => import('recharts').then(mod => mod.Line),
  { ssr: false }
) as any;

export const Pie = dynamic(
  () => import('recharts').then(mod => mod.Pie),
  { ssr: false }
) as any;

export const Area = dynamic(
  () => import('recharts').then(mod => mod.Area),
  { ssr: false }
) as any;

export const Cell = dynamic(
  () => import('recharts').then(mod => mod.Cell),
  { ssr: false }
) as any;

export const XAxis = dynamic(
  () => import('recharts').then(mod => mod.XAxis),
  { ssr: false }
) as any;

export const YAxis = dynamic(
  () => import('recharts').then(mod => mod.YAxis),
  { ssr: false }
) as any;

export const CartesianGrid = dynamic(
  () => import('recharts').then(mod => mod.CartesianGrid),
  { ssr: false }
) as any;

export const Tooltip = dynamic(
  () => import('recharts').then(mod => mod.Tooltip),
  { ssr: false }
) as any;

export const Legend = dynamic(
  () => import('recharts').then(mod => mod.Legend),
  { ssr: false }
) as any;

export const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => mod.ResponsiveContainer),
  { ssr: false }
) as any;