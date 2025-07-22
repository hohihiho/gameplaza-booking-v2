// 고객 분석 페이지
// 비전공자 설명: 고객 행동 패턴과 세그먼트를 분석하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Users,
  ChevronLeft,
  UserPlus,
  UserCheck,
  TrendingUp,
  Clock,
  Activity,
  Download,
  RefreshCw,
  Heart,
  BarChart3,
  Target
} from 'lucide-react';

type DateRange = 'week' | 'month' | 'quarter' | '6months' | '12months' | 'yearly' | 'custom';
type CustomerSegment = {
  name: string;
  count: number;
  percentage: number;
  avgSpent: number;
  description: string;
  trend: number;
};

export default function CustomerAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isLoading, setIsLoading] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);

  // API 데이터 가져오기
  useEffect(() => {
    const fetchCustomerData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          range: dateRange,
          ...(dateRange === 'custom' && { year: selectedYear })
        });
        
        const response = await fetch(`/api/admin/analytics/customers?${params}`);
        if (response.ok) {
          const data = await response.json();
          setCustomerData(data);
        } else {
          console.error('고객 데이터 조회 실패');
        }
      } catch (error) {
        console.error('API 호출 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerData();
  }, [dateRange, selectedYear]);

  // 기본값 설정 (API 데이터가 없을 때)
  const customerStats = customerData?.summary || {
    totalCustomers: 0,
    newCustomers: 0,
    returningCustomers: 0,
    growthRate: 0,
    avgReservationsPerCustomer: 0,
    topCustomerReservations: 0
  };

  // 고객 세그먼트 데이터
  const segments = customerData?.segments || {};
  const customerSegments: CustomerSegment[] = [
    {
      name: 'VIP 고객',
      count: segments.vip?.count || 0,
      percentage: segments.vip?.percentage || 0,
      avgSpent: 485000,
      description: '예약 10회 이상',
      trend: 15
    },
    {
      name: '단골 고객',
      count: segments.regular?.count || 0,
      percentage: segments.regular?.percentage || 0,
      avgSpent: 245000,
      description: '예약 3-9회',
      trend: 8
    },
    {
      name: '일반 고객',
      count: segments.occasional?.count || 0,
      percentage: segments.occasional?.percentage || 0,
      avgSpent: 125000,
      description: '예약 2회',
      trend: -2
    },
    {
      name: '신규 고객',
      count: segments.newCustomer?.count || 0,
      percentage: segments.newCustomer?.percentage || 0,
      avgSpent: 45000,
      description: '첫 예약 고객',
      trend: 12
    }
  ];


  // 선호 기기 분석 (향후 구현 예정)
  // const devicePreference = [
  //   { device: '마이마이 DX', customers: 312, percentage: 35 },
  //   { device: '사운드 볼텍스', customers: 223, percentage: 25 },
  //   { device: '춘리즘', customers: 178, percentage: 20 },
  //   { device: '태고의달인', customers: 134, percentage: 15 },
  //   { device: '기타', customers: 45, percentage: 5 }
  // ];


  // API 데이터만 사용
  const dailyCustomers = customerData?.dailyData || [];
  const retentionData = customerData?.retentionData || [];
  const customerActivityHours = customerData?.hourlyActivity || [];

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        range: dateRange,
        ...(dateRange === 'custom' && { year: selectedYear })
      });
      
      const response = await fetch(`/api/admin/analytics/customers?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCustomerData(data);
      }
    } catch (error) {
      console.error('새로고침 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    alert('고객 데이터를 다운로드합니다.');
  };

  return (
    <div>

      {/* 필터 및 액션 */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-4 mb-6">
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

          {/* 보기 모드 */}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div className={`flex items-center gap-1 text-sm ${
              customerStats.growthRate > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {customerStats.growthRate > 0 ? '+' : ''}{customerStats.growthRate}%
            </div>
          </div>
          <h3 className="text-2xl font-bold dark:text-white mb-1">
            {customerStats.totalCustomers.toLocaleString()}명
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">총 고객 수</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            신규 {customerStats.newCustomers}명
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <UserCheck className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-blue-600 dark:text-blue-400">26.2%</span>
          </div>
          <h3 className="text-2xl font-bold dark:text-white mb-1">
            {customerStats.returningCustomers}명
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">재방문 고객</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            평균 {customerStats.avgReservationsPerCustomer}회 예약
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Heart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold dark:text-white mb-1">
            {customerStats.avgReservationsPerCustomer}건
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">평균 예약 수</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            최다 {customerStats.topCustomerReservations}건
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-green-600 dark:text-green-400">-2일</span>
          </div>
          <h3 className="text-2xl font-bold dark:text-white mb-1">
            18일
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">평균 재방문 주기</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            지난달 대비 -2일
          </p>
        </motion.div>
      </div>

      {/* 고객 세그먼트 및 성장 추이 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 고객 세그먼트 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">고객 세그먼트</h2>
            <Target className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {customerSegments.map((segment, index) => (
              <motion.div
                key={segment.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium dark:text-white">{segment.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {segment.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold dark:text-white">{segment.count}명</p>
                    <p className={`text-sm flex items-center gap-1 ${
                      segment.trend > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendingUp className="w-3 h-3" />
                      {segment.trend > 0 ? '+' : ''}{segment.trend}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        style={{ width: `${segment.percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="ml-3 text-sm font-medium dark:text-white">
                    {segment.percentage}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  평균 지출: ₩{segment.avgSpent.toLocaleString()}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 고객 성장 추이 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">고객 성장 추이</h2>
            <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          <div className="h-64 flex items-end justify-between gap-2">
            {dailyCustomers.length > 0 ? (
              dailyCustomers.slice(0, 12).map((data, index) => {
                const maxTotal = Math.max(...dailyCustomers.map(d => (d.totalCustomers || 0)));
                const totalHeight = ((data.totalCustomers || 0) / maxTotal) * 100;
                const newHeight = ((data.newCustomers || 0) / (data.totalCustomers || 1)) * totalHeight;
                
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center"
                    title={`${data.date}: 전체 ${data.totalCustomers || 0}명, 신규 ${data.newCustomers || 0}명`}
                  >
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t relative h-full">
                      <div
                        className="absolute bottom-0 w-full bg-blue-300 dark:bg-blue-700 rounded-t"
                        style={{ height: `${totalHeight}%` }}
                      />
                      <div
                        className="absolute bottom-0 w-full bg-blue-600 rounded-t"
                        style={{ height: `${newHeight}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {index + 1}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center w-full h-full text-gray-500 dark:text-gray-400">
                {isLoading ? '데이터 로딩 중...' : '데이터가 없습니다'}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded" />
              <span className="text-gray-600 dark:text-gray-400">신규 고객</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-300 dark:bg-blue-700 rounded" />
              <span className="text-gray-600 dark:text-gray-400">기존 고객</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 추가 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 재방문율 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">재방문율</h2>
            <UserPlus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {retentionData.map((data) => (
              <div key={data.period} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {data.period}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
                      style={{ width: `${data.rate}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium dark:text-white w-12 text-right">
                    {data.rate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              평균 재방문 주기: <span className="font-medium dark:text-white">18일</span>
            </p>
          </div>
        </motion.div>

        {/* 선호 시간대 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">활동 시간대</h2>
            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {customerActivityHours.map((hour) => (
              <div key={hour.hour} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {hour.hour}시
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm dark:text-white">
                    {hour.customers}명
                  </span>
                  <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                    hour.percentage >= 25 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      : hour.percentage >= 15
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  }`}>
                    {hour.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}