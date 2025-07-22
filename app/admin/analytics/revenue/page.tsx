// 매출 분석 페이지
// 비전공자 설명: 일별/월별 매출 현황과 추이를 분석하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar,
  TrendingUp,
  DollarSign,
  BarChart3,
  Activity,
  Download,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Gamepad2,
  CreditCard,
  Receipt
} from 'lucide-react';

type DateRange = 'week' | 'month' | 'quarter' | '6months' | 'yearly' | 'custom';
type RevenueTrend = {
  date: string;
  revenue: number;
  count: number;
  avgPerRental: number;
};

export default function RevenueAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isLoading, setIsLoading] = useState(false);
  const [revenueData, setRevenueData] = useState<any>(null);

  // API 데이터 가져오기
  useEffect(() => {
    const fetchRevenueData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          range: dateRange,
          ...(dateRange === 'custom' && { year: selectedYear })
        });
        
        const response = await fetch(`/api/admin/analytics/revenue?${params}`);
        if (response.ok) {
          const data = await response.json();
          console.log('API 응답 데이터:', data);
          console.log('dailyRevenue 데이터:', data.dailyRevenue);
          setRevenueData(data);
        } else {
          console.error('매출 데이터 조회 실패');
        }
      } catch (error) {
        console.error('매출 데이터 조회 실패', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRevenueData();
  }, [dateRange, selectedYear]);

  // 기본값 설정 (API 데이터가 없을 때)
  const revenueStats = revenueData?.summary || {
    totalRevenue: 0,
    previousPeriodRevenue: 0,
    growthRate: 0,
    avgDailyRevenue: 0,
    avgRentalValue: 0,
    totalRentals: 0,
    peakDay: '',
    peakDayRevenue: 0
  };

  // API 데이터 기반으로 처리 (날짜 형식 그대로 사용)
  const dailyRevenue: RevenueTrend[] = revenueData?.dailyRevenue?.map(item => ({
    date: item.date, // 기간별로 이미 적절한 형식으로 반환됨
    revenue: item.revenue,
    count: item.count,
    avgPerRental: item.avgPerRental
  })) || [];

  console.log('처리된 dailyRevenue:', dailyRevenue);
  console.log('dailyRevenue 길이:', dailyRevenue.length);
  console.log('isLoading:', isLoading);
  console.log('revenueData:', revenueData);

  const deviceRevenue = revenueData?.deviceRevenue || [];
  const paymentMethodRevenue = revenueData?.paymentMethodRevenue || [];
  const hourlyRevenue = revenueData?.hourlyRevenue || [];

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        range: dateRange,
        ...(dateRange === 'custom' && { year: selectedYear })
      });
      
      const response = await fetch(`/api/admin/analytics/revenue?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRevenueData(data);
      }
    } catch (error) {
      console.error('새로고침 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    alert('매출 데이터를 다운로드합니다.');
  };

  const formatCurrency = (value: number) => {
    return `₩${value.toLocaleString()}`;
  };

  return (
    <div>
      {/* 필터 및 액션 */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 기간 선택 */}
          <div className="flex-1 flex flex-wrap gap-2">
            {(['week', 'month', 'quarter', '6months', 'yearly', 'custom'] as const).map((range) => (
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

        {/* 커스텀 기간 선택 */}
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

      {/* 매출 요약 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-green-600 dark:text-green-400">매출</span>
          </div>
          <h3 className="text-2xl font-bold dark:text-white mb-1">
            {formatCurrency(revenueStats.totalRevenue)}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">총 매출</p>
          <div className="flex items-center gap-1 mt-2">
            {revenueStats.growthRate > 0 ? (
              <ArrowUp className="w-4 h-4 text-green-500" />
            ) : (
              <ArrowDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm ${revenueStats.growthRate > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Math.abs(revenueStats.growthRate).toFixed(1)}%
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-blue-600 dark:text-blue-400">일평균</span>
          </div>
          <h3 className="text-2xl font-bold dark:text-white mb-1">
            {formatCurrency(revenueStats.avgDailyRevenue)}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">일평균 매출</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Receipt className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-purple-600 dark:text-purple-400">건당</span>
          </div>
          <h3 className="text-2xl font-bold dark:text-white mb-1">
            {formatCurrency(revenueStats.avgRentalValue)}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">평균 대여 금액</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-orange-600 dark:text-orange-400">대여</span>
          </div>
          <h3 className="text-2xl font-bold dark:text-white mb-1">
            {revenueStats.totalRentals}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">총 대여 건수</p>
        </motion.div>
      </div>

      {/* 매출 추이 차트 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold dark:text-white">
            {dateRange === 'week' && '일별 매출 추이 (월~일)'}
            {dateRange === 'month' && '주별 매출 추이'}
            {dateRange === 'quarter' && '분기별 매출 추이 (1~4분기)'}
            {dateRange === '6months' && '반기별 매출 추이 (상반기/하반기)'}
            {dateRange === 'yearly' && '월별 매출 추이 (1~12월)'}
            {dateRange === 'custom' && '월별 매출 추이 (1~12월)'}
            {!['week', 'month', 'quarter', '6months', 'yearly', 'custom'].includes(dateRange) && '매출 추이'}
          </h2>
          <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </div>
        
        {/* 디버깅 정보 추가 */}
        <div className="mb-4 p-2 bg-gray-100 rounded text-sm">
          <p>dailyRevenue 길이: {dailyRevenue.length}</p>
          <p>isLoading: {isLoading ? 'true' : 'false'}</p>
          <p>첫 번째 데이터: {dailyRevenue[0] ? JSON.stringify(dailyRevenue[0]) : 'null'}</p>
          <p>최대 매출: {dailyRevenue.length > 0 ? Math.max(...dailyRevenue.map(d => d.revenue)) : 0}</p>
        </div>
        
        {dailyRevenue.length > 0 ? (
          <div className="h-64 flex items-end justify-between gap-1 border border-red-500">
            {dailyRevenue.map((data, index) => {
              const maxRevenue = Math.max(...dailyRevenue.map(d => d.revenue));
              const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
              
              console.log(`차트 바 ${index}:`, {
                date: data.date,
                revenue: data.revenue,
                maxRevenue,
                height,
                heightStyle: `${height}%`
              });
              
              // 주말 체크 로직 (이번주 기간일 때만)
              let isWeekend = false;
              if (dateRange === 'week' && data.date.includes('(')) {
                const dayOfWeek = data.date.split('(')[1].replace(')', '');
                isWeekend = dayOfWeek === '토' || dayOfWeek === '일';
              }
              
              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center border border-blue-500"
                  title={`${data.date}: ${formatCurrency(data.revenue)}`}
                >
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t relative border border-green-500" style={{ height: '240px' }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-t transition-all ${
                        isWeekend 
                          ? 'bg-green-500 hover:bg-green-600' 
                          : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  {(dailyRevenue.length <= 7 || index % 2 === 0) && (
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {dateRange === 'week' && data.date.includes('(') 
                        ? data.date.split('(')[1].replace(')', '') 
                        : data.date
                      }
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            {isLoading ? '데이터 로딩 중...' : '데이터가 없습니다'}
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

      {/* 상세 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 기종별 매출 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">기종별 매출</h2>
            <Gamepad2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {deviceRevenue.map((device, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium dark:text-white">{device.name}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatCurrency(device.revenue)} ({device.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    style={{ width: `${device.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 시간대별 매출 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">시간대별 매출</h2>
            <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {hourlyRevenue.map((hour, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium dark:text-white">{hour.hour}시</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatCurrency(hour.revenue)} ({hour.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
                    style={{ width: `${hour.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 결제 방식별 매출 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">결제 방식별 매출</h2>
            <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {paymentMethodRevenue.map((method, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium dark:text-white">{method.method}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatCurrency(method.revenue)} ({method.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${method.color}`}
                    style={{ width: `${method.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}