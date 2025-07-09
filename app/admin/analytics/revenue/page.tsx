// 매출 분석 페이지
// 비전공자 설명: 일별/월별 매출 현황과 추이를 분석하는 페이지입니다
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Calendar,
  ChevronLeft,
  TrendingUp,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  Download,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Gamepad2,
  CreditCard,
  Receipt
} from 'lucide-react';

type DateRange = '7days' | '30days' | '90days' | '12months' | 'custom';
type RevenueTrend = {
  date: string;
  revenue: number;
  count: number;
  avgPerOrder: number;
};

export default function RevenueAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  // const [startDate, setStartDate] = useState('');
  // const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  // 매출 통계 요약 (실제로는 API에서 가져옴)
  const revenueStats = {
    totalRevenue: 14850000,
    previousPeriodRevenue: 12350000,
    growthRate: 20.2,
    avgDailyRevenue: 495000,
    avgOrderValue: 43200,
    totalOrders: 342,
    peakDay: '2024-01-20',
    peakDayRevenue: 825000
  };

  // 일별 매출 데이터
  const dailyRevenue: RevenueTrend[] = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseRevenue = isWeekend ? 600000 : 400000;
    const variance = Math.random() * 200000 - 100000;
    const revenue = Math.floor(baseRevenue + variance);
    const count = Math.floor(revenue / 40000) + Math.floor(Math.random() * 5);
    
    return {
      date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      revenue,
      count,
      avgPerOrder: Math.floor(revenue / count)
    };
  });

  // 월별 매출 데이터
  const monthlyRevenue = [
    { month: '10월', revenue: 12850000, growth: 8.5 },
    { month: '11월', revenue: 13450000, growth: 4.7 },
    { month: '12월', revenue: 15200000, growth: 13.0 },
    { month: '1월', revenue: 14850000, growth: -2.3 }
  ];

  // 기기별 매출 분포
  const deviceRevenue = [
    { name: '마이마이 DX', revenue: 5423000, percentage: 36.5, count: 125 },
    { name: '사운드 볼텍스', revenue: 3771900, percentage: 25.4, count: 87 },
    { name: '춘리즘', revenue: 2950350, percentage: 19.9, count: 68 },
    { name: '태고의달인', revenue: 1822450, percentage: 12.3, count: 42 },
    { name: '기타', revenue: 882300, percentage: 5.9, count: 20 }
  ];

  // 결제 방식별 매출
  const paymentMethodRevenue = [
    { method: '현금', revenue: 5940000, percentage: 40, color: 'bg-green-500' },
    { method: '계좌이체', revenue: 8910000, percentage: 60, color: 'bg-blue-500' }
  ];

  // 시간대별 매출
  const hourlyRevenue = [
    { hour: '10-12', revenue: 1782000, percentage: 12 },
    { hour: '12-14', revenue: 2227500, percentage: 15 },
    { hour: '14-16', revenue: 3712500, percentage: 25 },
    { hour: '16-18', revenue: 2970000, percentage: 20 },
    { hour: '18-20', revenue: 2524500, percentage: 17 },
    { hour: '20-22', revenue: 1633500, percentage: 11 }
  ];

  // 플레이 모드별 매출 (리듬게임)
  const playModeRevenue = [
    { mode: '2인 플레이', revenue: 6435000, percentage: 65 },
    { mode: '1인 플레이', revenue: 3465000, percentage: 35 }
  ];

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleExport = () => {
    alert('매출 데이터를 다운로드합니다.');
  };

  const formatCurrency = (value: number) => {
    return `₩${value.toLocaleString()}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/admin"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <h1 className="text-2xl font-bold dark:text-white">매출 분석</h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
          매출 데이터를 분석하여 수익 현황과 트렌드를 파악합니다
        </p>
      </div>

      {/* 필터 및 액션 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 기간 선택 */}
          <div className="flex-1 flex flex-wrap gap-2">
            {(['7days', '30days', '90days', '12months'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {range === '7days' && '최근 7일'}
                {range === '30days' && '최근 30일'}
                {range === '90days' && '최근 90일'}
                {range === '12months' && '최근 12개월'}
              </button>
            ))}
          </div>

          {/* 보기 모드 */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'daily' ? 'monthly' : 'daily')}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              {viewMode === 'daily' ? '월별 보기' : '일별 보기'}
            </button>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              title="새로고침"
              className="p-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              내보내기
            </button>
          </div>
        </div>
      </div>

      {/* 핵심 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div className={`flex items-center gap-1 text-sm ${
              revenueStats.growthRate > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {revenueStats.growthRate > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              {Math.abs(revenueStats.growthRate)}%
            </div>
          </div>
          <h3 className="text-2xl font-bold dark:text-white mb-1">
            {formatCurrency(revenueStats.totalRevenue)}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">총 매출</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            전 기간 대비 {revenueStats.growthRate > 0 ? '+' : ''}{formatCurrency(revenueStats.totalRevenue - revenueStats.previousPeriodRevenue)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-blue-600 dark:text-blue-400">일평균</span>
          </div>
          <h3 className="text-2xl font-bold dark:text-white mb-1">
            {formatCurrency(revenueStats.avgDailyRevenue)}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">일평균 매출</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            최고: {formatCurrency(revenueStats.peakDayRevenue)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Receipt className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-purple-600 dark:text-purple-400">{revenueStats.totalOrders}건</span>
          </div>
          <h3 className="text-2xl font-bold dark:text-white mb-1">
            {formatCurrency(revenueStats.avgOrderValue)}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">평균 주문 금액</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            일평균 {Math.floor(revenueStats.totalOrders / 30)}건
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-bold dark:text-white mb-1">
            {revenueStats.peakDay}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">최고 매출일</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            {formatCurrency(revenueStats.peakDayRevenue)}
          </p>
        </motion.div>
      </div>

      {/* 매출 추이 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 일별/월별 매출 추이 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">
              {viewMode === 'daily' ? '일별 매출 추이' : '월별 매출 추이'}
            </h2>
            <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          {viewMode === 'daily' ? (
            <div className="h-64 flex items-end justify-between gap-1">
              {dailyRevenue.map((data, index) => {
                const maxRevenue = Math.max(...dailyRevenue.map(d => d.revenue));
                const height = (data.revenue / maxRevenue) * 100;
                const isWeekend = index % 7 === 5 || index % 7 === 6;
                
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center"
                    title={`${data.date}: ${formatCurrency(data.revenue)}`}
                  >
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t relative">
                      <div
                        className={`absolute bottom-0 w-full rounded-t transition-all ${
                          isWeekend 
                            ? 'bg-green-500 hover:bg-green-600' 
                            : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    {index % 5 === 0 && (
                      <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {data.date.split(' ')[1]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {monthlyRevenue.map((month) => (
                <div key={month.month} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium dark:text-white">{month.month}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium dark:text-white">
                        {formatCurrency(month.revenue)}
                      </span>
                      <span className={`text-sm flex items-center gap-1 ${
                        month.growth > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {month.growth > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {Math.abs(month.growth)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                      style={{ width: `${(month.revenue / 16000000) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-gray-600 dark:text-gray-400">평일</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-gray-600 dark:text-gray-400">주말</span>
            </div>
          </div>
        </motion.div>

        {/* 시간대별 매출 분포 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">시간대별 매출</h2>
            <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {hourlyRevenue.map((hour, index) => (
              <div key={hour.hour} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{hour.hour}시</span>
                  <span className="font-medium dark:text-white">
                    {formatCurrency(hour.revenue)} ({hour.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${hour.percentage}%` }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              피크 시간대: 14:00-16:00 (25%)
            </p>
          </div>
        </motion.div>
      </div>

      {/* 상세 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 기기별 매출 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">기기별 매출</h2>
            <Gamepad2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {deviceRevenue.map((device) => (
              <div key={device.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {device.name}
                  </span>
                  <span className="text-sm font-medium dark:text-white">
                    {device.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    style={{ width: `${device.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {formatCurrency(device.revenue)} ({device.count}건)
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 결제 방식별 매출 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">결제 방식</h2>
            <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {paymentMethodRevenue.map((method) => (
              <div key={method.method} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded ${method.color}`} />
                  <div>
                    <p className="font-medium dark:text-white">{method.method}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatCurrency(method.revenue)}
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold dark:text-white">
                  {method.percentage}%
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">총 결제</span>
              <span className="font-medium dark:text-white">
                {formatCurrency(revenueStats.totalRevenue)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* 플레이 모드별 매출 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">플레이 모드</h2>
            <PieChart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="16"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56 * 0.65} ${2 * Math.PI * 56 * 0.35}`}
                  className="text-blue-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold dark:text-white">65%</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">2인</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {playModeRevenue.map((mode) => (
              <div key={mode.mode} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {mode.mode}
                </span>
                <div className="text-right">
                  <p className="font-medium dark:text-white">
                    {formatCurrency(mode.revenue)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {mode.percentage}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}