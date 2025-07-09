// 고객 분석 페이지
// 비전공자 설명: 고객 행동 패턴과 세그먼트를 분석하는 페이지입니다
'use client';

import { useState } from 'react';
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
  Star,
  BarChart3,
  Target,
  Award
} from 'lucide-react';

type DateRange = '7days' | '30days' | '90days' | '12months';
type CustomerSegment = {
  name: string;
  count: number;
  percentage: number;
  avgSpent: number;
  description: string;
  trend: number;
};

export default function CustomerAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  const [isLoading, setIsLoading] = useState(false);

  // 고객 통계 요약
  const customerStats = {
    totalCustomers: 892,
    newCustomers: 156,
    returningCustomers: 234,
    churnRate: 12.5,
    avgLifetimeValue: 245000,
    avgVisitsPerCustomer: 3.8,
    topCustomerSpent: 850000,
    nps: 72 // Net Promoter Score
  };

  // 고객 세그먼트
  const customerSegments: CustomerSegment[] = [
    {
      name: 'VIP 고객',
      count: 89,
      percentage: 10,
      avgSpent: 485000,
      description: '월 4회 이상 방문',
      trend: 15
    },
    {
      name: '단골 고객',
      count: 267,
      percentage: 30,
      avgSpent: 245000,
      description: '월 2-3회 방문',
      trend: 8
    },
    {
      name: '일반 고객',
      count: 356,
      percentage: 40,
      avgSpent: 125000,
      description: '월 1회 방문',
      trend: -2
    },
    {
      name: '신규 고객',
      count: 180,
      percentage: 20,
      avgSpent: 45000,
      description: '첫 방문 고객',
      trend: 12
    }
  ];

  // 재방문율 추이
  const retentionData = [
    { period: '1주 후', rate: 65 },
    { period: '2주 후', rate: 48 },
    { period: '1개월 후', rate: 35 },
    { period: '2개월 후', rate: 28 },
    { period: '3개월 후', rate: 22 }
  ];

  // 고객 활동 시간대
  const customerActivityHours = [
    { hour: '10-12', customers: 45, percentage: 5 },
    { hour: '12-14', customers: 89, percentage: 10 },
    { hour: '14-16', customers: 178, percentage: 20 },
    { hour: '16-18', customers: 223, percentage: 25 },
    { hour: '18-20', customers: 267, percentage: 30 },
    { hour: '20-22', customers: 90, percentage: 10 }
  ];

  // 선호 기기 분석 (향후 구현 예정)
  // const devicePreference = [
  //   { device: '마이마이 DX', customers: 312, percentage: 35 },
  //   { device: '사운드 볼텍스', customers: 223, percentage: 25 },
  //   { device: '춘리즘', customers: 178, percentage: 20 },
  //   { device: '태고의달인', customers: 134, percentage: 15 },
  //   { device: '기타', customers: 45, percentage: 5 }
  // ];

  // 고객 만족도
  const satisfactionData = {
    veryHappy: 45,
    happy: 35,
    neutral: 15,
    unhappy: 3,
    veryUnhappy: 2
  };

  // 고객 성장 추이
  const customerGrowth = Array.from({ length: 12 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - (11 - i));
    return {
      month: month.toLocaleDateString('ko-KR', { month: 'short' }),
      total: 500 + Math.floor(Math.random() * 100) + i * 35,
      new: 80 + Math.floor(Math.random() * 40)
    };
  });

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleExport = () => {
    alert('고객 데이터를 다운로드합니다.');
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
          <h1 className="text-2xl font-bold dark:text-white">고객 분석</h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
          고객 행동 패턴을 분석하여 맞춤형 서비스를 제공합니다
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
      </div>

      {/* 핵심 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-green-600 dark:text-green-400">+21.2%</span>
          </div>
          <h3 className="text-2xl font-bold dark:text-white mb-1">
            {customerStats.totalCustomers}
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
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <UserCheck className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-blue-600 dark:text-blue-400">26.2%</span>
          </div>
          <h3 className="text-2xl font-bold dark:text-white mb-1">
            {customerStats.returningCustomers}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">재방문 고객</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            평균 {customerStats.avgVisitsPerCustomer}회 방문
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Heart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold dark:text-white mb-1">
            ₩{customerStats.avgLifetimeValue.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">평균 고객 가치</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            최고 ₩{customerStats.topCustomerSpent.toLocaleString()}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Award className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-green-600 dark:text-green-400">+8점</span>
          </div>
          <h3 className="text-2xl font-bold dark:text-white mb-1">
            {customerStats.nps}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">NPS 점수</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            매우 우수
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
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
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
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">고객 성장 추이</h2>
            <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          <div className="h-64 flex items-end justify-between gap-2">
            {customerGrowth.map((data, index) => {
              const maxTotal = Math.max(...customerGrowth.map(d => d.total));
              const totalHeight = (data.total / maxTotal) * 100;
              const newHeight = (data.new / data.total) * totalHeight;
              
              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center"
                  title={`${data.month}: 전체 ${data.total}명, 신규 ${data.new}명`}
                >
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t relative">
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
                    {data.month}
                  </span>
                </div>
              );
            })}
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
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
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
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
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

        {/* 고객 만족도 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">고객 만족도</h2>
            <Star className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          <div className="flex items-center justify-center mb-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-500 mb-1">4.6</div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= 4 ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">매우 만족</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 bg-green-500 rounded-full"
                    style={{ width: `${satisfactionData.veryHappy}%` }}
                  />
                </div>
                <span className="dark:text-white w-10 text-right">{satisfactionData.veryHappy}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">만족</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${satisfactionData.happy}%` }}
                  />
                </div>
                <span className="dark:text-white w-10 text-right">{satisfactionData.happy}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">보통</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 bg-gray-500 rounded-full"
                    style={{ width: `${satisfactionData.neutral}%` }}
                  />
                </div>
                <span className="dark:text-white w-10 text-right">{satisfactionData.neutral}%</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}