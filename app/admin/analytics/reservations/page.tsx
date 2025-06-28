// 예약 통계 페이지
// 비전공자 설명: 예약 관련 각종 통계를 시각화하여 보여주는 페이지입니다
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Calendar,
  ChevronLeft,
  Users,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Download,
  RefreshCw,
  Gamepad2,
  Timer,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

// 차트 라이브러리 (실제로는 recharts 등 사용)
// import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type DateRange = '7days' | '30days' | '90days' | 'custom';
type ChartData = {
  date: string;
  count: number;
  cancelled: number;
  completed: number;
};

export default function ReservationAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 통계 데이터 (실제로는 API에서 가져옴)
  const summaryStats = {
    totalReservations: 342,
    completionRate: 92.3,
    cancellationRate: 7.7,
    avgReservationsPerDay: 11.4,
    peakHour: '14:00-16:00',
    popularDevice: '마이마이 DX',
    avgLeadTime: 2.3, // 예약부터 이용까지 평균 일수
    repeatCustomerRate: 68.5
  };

  // 일별 예약 추이 데이터
  const dailyReservations: ChartData[] = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const count = Math.floor(Math.random() * 15) + 5;
    const cancelled = Math.floor(count * 0.08);
    const completed = count - cancelled;

    return {
      date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      count,
      cancelled,
      completed
    };
  });

  // 시간대별 예약 분포
  const hourlyDistribution = [
    { hour: '10-12', count: 45, percentage: 13.2 },
    { hour: '12-14', count: 52, percentage: 15.2 },
    { hour: '14-16', count: 78, percentage: 22.8 },
    { hour: '16-18', count: 65, percentage: 19.0 },
    { hour: '18-20', count: 58, percentage: 17.0 },
    { hour: '20-22', count: 44, percentage: 12.8 }
  ];

  // 기기별 예약 분포
  const deviceDistribution = [
    { name: '마이마이 DX', count: 125, percentage: 36.5, color: 'bg-pink-500' },
    { name: '사운드 볼텍스', count: 87, percentage: 25.4, color: 'bg-blue-500' },
    { name: '춘리즘', count: 68, percentage: 19.9, color: 'bg-purple-500' },
    { name: '태고의달인', count: 42, percentage: 12.3, color: 'bg-orange-500' },
    { name: '기타', count: 20, percentage: 5.9, color: 'bg-gray-500' }
  ];

  // 요일별 예약 패턴
  const weekdayPattern = [
    { day: '월', count: 38, avg: 5.4 },
    { day: '화', count: 35, avg: 5.0 },
    { day: '수', count: 42, avg: 6.0 },
    { day: '목', count: 45, avg: 6.4 },
    { day: '금', count: 68, avg: 9.7 },
    { day: '토', count: 85, avg: 12.1 },
    { day: '일', count: 72, avg: 10.3 }
  ];

  // 예약 상태별 통계
  const statusBreakdown = {
    pending: { count: 8, percentage: 2.3 },
    approved: { count: 18, percentage: 5.3 },
    completed: { count: 285, percentage: 83.3 },
    cancelled: { count: 26, percentage: 7.6 },
    noShow: { count: 5, percentage: 1.5 }
  };

  // 신규 vs 재방문 고객
  const customerTypeData = [
    { type: '신규 고객', count: 108, percentage: 31.5 },
    { type: '재방문 고객', count: 234, percentage: 68.5 }
  ];

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleExport = () => {
    // 실제로는 CSV/Excel 다운로드 구현
    alert('통계 데이터를 다운로드합니다.');
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
          <h1 className="text-2xl font-bold dark:text-white">예약 통계</h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
          예약 데이터를 분석하여 비즈니스 인사이트를 제공합니다
        </p>
      </div>

      {/* 필터 및 액션 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 기간 선택 */}
          <div className="flex-1 flex flex-wrap gap-2">
            {(['7days', '30days', '90days'] as const).map((range) => (
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
              </button>
            ))}
            <button
              onClick={() => setDateRange('custom')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              직접 선택
            </button>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              새로고침
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

        {/* 커스텀 날짜 선택 */}
        {dateRange === 'custom' && (
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                시작일
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                종료일
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* 핵심 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-green-600 dark:text-green-400">+12.5%</span>
          </div>
          <h3 className="text-2xl font-bold dark:text-white mb-1">
            {summaryStats.totalReservations}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">총 예약 수</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            일평균 {summaryStats.avgReservationsPerDay}건
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-green-600 dark:text-green-400">+2.3%</span>
          </div>
          <h3 className="text-2xl font-bold dark:text-white mb-1">
            {summaryStats.completionRate}%
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">완료율</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            취소율 {summaryStats.cancellationRate}%
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-green-600 dark:text-green-400">+5.7%</span>
          </div>
          <h3 className="text-2xl font-bold dark:text-white mb-1">
            {summaryStats.repeatCustomerRate}%
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">재방문율</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            평균 {summaryStats.avgLeadTime}일 전 예약
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <Gamepad2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-bold dark:text-white mb-1">
            {summaryStats.peakHour}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">피크 시간대</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            인기: {summaryStats.popularDevice}
          </p>
        </motion.div>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 일별 예약 추이 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">일별 예약 추이</h2>
            <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          {/* 차트 영역 (실제로는 recharts 등 사용) */}
          <div className="h-64 flex items-end justify-between gap-1">
            {dailyReservations.map((data, index) => {
              const maxCount = Math.max(...dailyReservations.map(d => d.count));
              const height = (data.count / maxCount) * 100;
              
              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center"
                  title={`${data.date}: ${data.count}건`}
                >
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t relative">
                    <div
                      className="absolute bottom-0 w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
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
          
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-gray-600 dark:text-gray-400">예약 수</span>
            </div>
          </div>
        </motion.div>

        {/* 시간대별 분포 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">시간대별 예약 분포</h2>
            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {hourlyDistribution.map((hour, index) => (
              <div key={hour.hour} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{hour.hour}시</span>
                  <span className="font-medium dark:text-white">
                    {hour.count}건 ({hour.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${hour.percentage}%` }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 추가 통계 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 기기별 예약 분포 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">기기별 예약</h2>
            <PieChart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {deviceDistribution.map((device) => (
              <div key={device.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded ${device.color}`} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {device.name}
                  </span>
                </div>
                <span className="font-medium dark:text-white">
                  {device.percentage}%
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              총 {summaryStats.totalReservations}건 중
            </p>
          </div>
        </motion.div>

        {/* 요일별 패턴 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">요일별 패턴</h2>
            <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          <div className="flex items-end justify-between gap-2 h-40">
            {weekdayPattern.map((day) => {
              const maxCount = Math.max(...weekdayPattern.map(d => d.count));
              const height = (day.count / maxCount) * 100;
              
              return (
                <div key={day.day} className="flex-1 flex flex-col items-center">
                  <div className="relative w-full h-full flex items-end">
                    <div
                      className={`w-full rounded-t transition-all ${
                        ['토', '일'].includes(day.day)
                          ? 'bg-blue-500 hover:bg-blue-600'
                          : 'bg-gray-400 hover:bg-gray-500'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium dark:text-white mt-2">
                    {day.day}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {day.avg}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 예약 상태 분석 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">상태별 분석</h2>
            <AlertCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  완료
                </span>
              </div>
              <span className="font-semibold text-green-800 dark:text-green-200">
                {statusBreakdown.completed.percentage}%
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-800 dark:text-red-200">
                  취소
                </span>
              </div>
              <span className="font-semibold text-red-800 dark:text-red-200">
                {statusBreakdown.cancelled.percentage}%
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  진행중
                </span>
              </div>
              <span className="font-semibold text-yellow-800 dark:text-yellow-200">
                {(statusBreakdown.pending.percentage + statusBreakdown.approved.percentage).toFixed(1)}%
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  노쇼
                </span>
              </div>
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {statusBreakdown.noShow.percentage}%
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}