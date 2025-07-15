// 예약 통계 페이지
// 비전공자 설명: 예약 관련 각종 통계를 시각화하여 보여주는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
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
  AlertCircle,
  Loader2
} from 'lucide-react';

// 차트 라이브러리 (실제로는 recharts 등 사용)
// import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type DateRange = 'week' | 'month' | 'quarter' | '6months' | '12months' | 'yearly' | 'custom';
type ChartData = {
  date: string;
  count: number;
  cancelled: number;
  completed: number;
};

export default function ReservationAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // API에서 데이터 가져오기
  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      let url = `/api/admin/analytics/reservations?range=${dateRange}`;
      
      if (dateRange === 'custom' && selectedYear) {
        url += `&year=${selectedYear}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('데이터 조회 실패');
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Analytics fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, selectedYear]);

  // 로딩 중이거나 데이터가 없으면 로딩 표시
  if (isLoading || !analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const {
    summaryStats,
    dailyReservations,
    hourlyDistribution,
    deviceDistribution,
    weekdayPattern,
    statusStats
  } = analyticsData;

  // 예약 상태별 통계
  const statusBreakdown = {
    pending: { count: statusStats.pending, percentage: summaryStats.totalReservations > 0 ? (statusStats.pending / summaryStats.totalReservations * 100) : 0 },
    approved: { count: statusStats.approved, percentage: summaryStats.totalReservations > 0 ? (statusStats.approved / summaryStats.totalReservations * 100) : 0 },
    completed: { count: statusStats.completed, percentage: summaryStats.totalReservations > 0 ? (statusStats.completed / summaryStats.totalReservations * 100) : 0 },
    cancelled: { count: statusStats.cancelled, percentage: summaryStats.totalReservations > 0 ? (statusStats.cancelled / summaryStats.totalReservations * 100) : 0 },
    noShow: { count: statusStats.noShow, percentage: summaryStats.totalReservations > 0 ? (statusStats.noShow / summaryStats.totalReservations * 100) : 0 }
  };

  const handleRefresh = () => {
    fetchAnalyticsData();
  };

  const handleExport = () => {
    // 실제로는 CSV/Excel 다운로드 구현
    alert('통계 데이터를 다운로드합니다.');
  };

  return (
    <div>

      {/* 필터 및 액션 */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 기간 선택 */}
          <div className="flex-1 flex flex-wrap gap-2">
            {(['week', 'month', 'quarter', '6months', '12months', 'yearly', 'custom'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {range === 'week' && '이번주'}
                {range === 'month' && '이번달'}
                {range === 'quarter' && '분기별'}
                {range === '6months' && '반기별'}
                {range === '12months' && '12개월'}
                {range === 'yearly' && '년도별'}
                {range === 'custom' && '기간 선택'}
              </button>
            ))}
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2">
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

        {/* 커스텀 기간 선택 - 년도 선택 */}
        {dateRange === 'custom' && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                년도 선택
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {/* 최근 5년간 년도 표시 */}
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>
                      {year}년
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 핵심 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className={`text-sm ${
              (summaryStats.reservationGrowthRate || 0) >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {(summaryStats.reservationGrowthRate || 0) >= 0 ? '+' : ''}{summaryStats.reservationGrowthRate || 0}%
            </span>
          </div>
          <h3 className="text-2xl font-bold dark:text-white mb-1">
            {summaryStats.totalReservations.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">총 예약 수</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            일평균 {summaryStats.avgReservationsPerDay.toFixed(1)}건
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className={`text-sm ${
              (summaryStats.completionRateChange || 0) >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {(summaryStats.completionRateChange || 0) >= 0 ? '+' : ''}{summaryStats.completionRateChange || 0}%
            </span>
          </div>
          <h3 className="text-2xl font-bold dark:text-white mb-1">
            {summaryStats.completionRate}%
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">완료율</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            취소율 {summaryStats.cancellationRate}%
          </p>
        </motion.div>

      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 일별 예약 추이 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">
              {dateRange === 'week' && '일별 예약 추이 (월~일)'}
              {dateRange === 'month' && '주별 예약 추이'}
              {dateRange === 'quarter' && '분기별 예약 추이 (1~4분기)'}
              {dateRange === '6months' && '반기별 예약 추이'}
              {dateRange === '12months' && '월별 예약 추이 (1~12월)'}
              {dateRange === 'yearly' && '년도별 예약 추이'}
              {dateRange === 'custom' && '월별 예약 추이 (1~12월)'}
            </h2>
            <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          {/* 차트 영역 (실제로는 recharts 등 사용) */}
          <div className="h-64">
            {dailyReservations && dailyReservations.length > 0 ? (
              <div className="h-full flex items-end gap-1">
                {dailyReservations.map((data, index) => {
                  const maxCount = Math.max(...dailyReservations.map(d => d.count), 1);
                  const height = data.count > 0 ? (data.count / maxCount) * 100 : 0;
                  
                  return (
                    <div
                      key={index}
                      className="flex-1 min-w-0 flex flex-col items-center"
                      title={`${data.date}: ${data.count}건`}
                    >
                      <div className="w-full h-56 relative flex items-end">
                        <div
                          className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 whitespace-nowrap">
                        {dateRange === 'week' && data.date.includes('(') 
                          ? data.date.split('(')[1].replace(')', '') // 요일만 표시
                          : dateRange === '12months' && data.date.includes('월')
                          ? data.date.replace('월', '') // 숫자만 표시
                          : dateRange === 'custom' && data.date.includes('월')
                          ? data.date.replace('월', '') // 숫자만 표시
                          : data.date
                        }
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">데이터가 없습니다</p>
              </div>
            )}
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
          transition={{ delay: 0.3 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">시간대별 예약 분포</h2>
            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {hourlyDistribution.length > 0 ? (
              hourlyDistribution.map((hour, index) => (
                <div key={`${hour.hour}-${hour.slot_type}-${index}`} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">{hour.hour}시</span>
                      {hour.slot_type && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          hour.slot_type === 'early' 
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        }`}>
                          {hour.slot_type === 'early' ? '조기' : '밤샘'}
                        </span>
                      )}
                    </div>
                    <span className="font-medium dark:text-white">
                      {hour.count}건 ({hour.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${hour.percentage}%` }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                      className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                등록된 대여 시간대가 없습니다
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* 추가 통계 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 기기별 예약 분포 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">기종별 예약</h2>
            <PieChart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {deviceDistribution.length > 0 ? (
              deviceDistribution.map((device) => (
                <div key={device.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded ${device.color}`} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {device.name}
                    </span>
                  </div>
                  <span className="font-medium dark:text-white">
                    {device.percentage.toFixed(1)}%
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                예약 데이터가 없습니다
              </p>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              총 {summaryStats.totalReservations.toLocaleString()}건 중
            </p>
          </div>
        </motion.div>

        {/* 요일별 패턴 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">요일별 패턴</h2>
            <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          <div className="h-48">
            {weekdayPattern && weekdayPattern.length > 0 ? (
              <div className="h-full flex items-end gap-2">
                {weekdayPattern.map((day) => {
                  const maxCount = Math.max(...weekdayPattern.map(d => d.count), 1);
                  const height = day.count > 0 ? (day.count / maxCount) * 100 : 0;
                  
                  return (
                    <div key={day.day} className="flex-1 min-w-0 flex flex-col items-center">
                      <div className="w-full h-32 relative flex items-end">
                        <div
                          className={`w-full rounded-t transition-all ${
                            ['토', '일'].includes(day.day)
                              ? 'bg-blue-500 hover:bg-blue-600'
                              : 'bg-gray-400 hover:bg-gray-500'
                          }`}
                          style={{ height: height > 0 ? `${height}%` : '2px' }}
                          title={`${day.count}건`}
                        />
                      </div>
                      <span className="text-sm font-medium dark:text-white mt-2">
                        {day.day}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {day.count}건
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <p className="text-sm text-gray-500 dark:text-gray-400">데이터가 없습니다</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* 예약 상태 분석 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
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
                {statusBreakdown.completed.percentage.toFixed(1)}%
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
                {statusBreakdown.cancelled.percentage.toFixed(1)}%
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
                {statusBreakdown.noShow.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}