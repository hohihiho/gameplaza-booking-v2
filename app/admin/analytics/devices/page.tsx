// 기종 분석 페이지
// 비전공자 설명: 각 게임 기종별 사용 패턴과 매출을 분석하는 페이지입니다
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
  Clock,
  Target,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  CreditCard
} from 'lucide-react';

type DateRange = 'week' | 'month' | 'quarter' | '6months' | '12months' | 'yearly' | 'custom';

export default function DeviceAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // API 데이터 가져오기
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          range: dateRange,
          ...(dateRange === 'custom' && { year: selectedYear }),
          ...(selectedDeviceType !== 'all' && { deviceType: selectedDeviceType })
        });
        
        const response = await fetch(`/api/admin/analytics/devices?${params}`);
        if (response.ok) {
          const data = await response.json();
          setAnalyticsData(data);
          
          // 첫 번째 기종을 기본 선택으로 설정
          if (selectedDeviceType === 'all' && data.deviceTypes?.length > 0) {
            setSelectedDeviceType(data.deviceTypes[0].id);
          }
        } else {
          console.error('기종 분석 데이터 조회 실패');
        }
      } catch (error) {
        console.error('API 호출 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [dateRange, selectedYear]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        range: dateRange,
        ...(dateRange === 'custom' && { year: selectedYear })
      });
      
      const response = await fetch(`/api/admin/analytics/devices?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('새로고침 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    alert('기종 분석 데이터를 다운로드합니다.');
  };

  const formatCurrency = (value: number) => {
    return `₩${value.toLocaleString()}`;
  };

  // 현재 선택된 기종의 데이터
  const currentDeviceData = selectedDeviceType !== 'all' && analyticsData?.deviceAnalytics?.[selectedDeviceType];
  const summary = analyticsData?.summary || {};

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

      {/* 전체 요약 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Gamepad2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-blue-600 dark:text-blue-400">기종</span>
          </div>
          <h3 className="text-2xl font-bold dark:text-white mb-1">
            {summary.totalDeviceTypes || 0}개
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">운영 중인 기종</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-green-600 dark:text-green-400">예약</span>
          </div>
          <h3 className="text-2xl font-bold dark:text-white mb-1">
            {summary.totalReservations || 0}건
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">총 예약 수</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-purple-600 dark:text-purple-400">매출</span>
          </div>
          <h3 className="text-2xl font-bold dark:text-white mb-1">
            {formatCurrency(summary.totalRevenue || 0)}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">총 매출</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-yellow-600 dark:text-yellow-400">인기</span>
          </div>
          <h3 className="text-lg font-bold dark:text-white mb-1">
            {summary.mostPopularDevice?.deviceType?.name || '없음'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">인기 기종</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            {summary.mostPopularDevice?.summary?.totalReservations || 0}건 예약
          </p>
        </motion.div>
      </div>

      {/* 기종별 탭 */}
      {analyticsData?.deviceTypes && (
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm mb-6">
          <div className="px-6">
            <nav className="flex space-x-1 -mb-px overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
              <button
                onClick={() => setSelectedDeviceType('all')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap hover:scale-105 ${
                  selectedDeviceType === 'all'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                전체 비교
              </button>
              {analyticsData.deviceTypes.map((deviceType) => (
                <button
                  key={deviceType.id}
                  onClick={() => setSelectedDeviceType(deviceType.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap hover:scale-105 ${
                    selectedDeviceType === deviceType.id
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
                  }`}
                >
                  <Gamepad2 className="w-4 h-4" />
                  {deviceType.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* 선택된 기종의 상세 분석 */}
      {selectedDeviceType === 'all' ? (
        // 전체 기종 비교 뷰
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold dark:text-white">기종별 성과 비교</h2>
              <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            
            <div className="space-y-4">
              {analyticsData?.deviceTypes?.map((deviceType) => {
                const deviceData = analyticsData.deviceAnalytics[deviceType.id];
                if (!deviceData) return null;
                
                const maxReservations = Math.max(...Object.values(analyticsData.deviceAnalytics).map((d: any) => d.summary.totalReservations));
                const reservationPercentage = maxReservations > 0 ? (deviceData.summary.totalReservations / maxReservations) * 100 : 0;
                
                return (
                  <div key={deviceType.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium dark:text-white">{deviceType.name}</h3>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {deviceData.summary.totalReservations}건
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatCurrency(deviceData.summary.totalRevenue)}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        style={{ width: `${reservationPercentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>완료율: {deviceData.statusRates.completion.toFixed(1)}%</span>
                      <span>평균: {formatCurrency(deviceData.summary.avgRevenuePerReservation)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      ) : currentDeviceData ? (
        // 개별 기종 상세 분석
        <div className="space-y-6">
          {/* 기종 기본 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-600 dark:text-blue-400">예약</span>
              </div>
              <h3 className="text-2xl font-bold dark:text-white mb-1">
                {currentDeviceData.summary.totalReservations}건
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">총 예약</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-600 dark:text-green-400">완료율</span>
              </div>
              <h3 className="text-2xl font-bold dark:text-white mb-1">
                {currentDeviceData.statusRates.completion.toFixed(1)}%
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">예약 완료율</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-purple-600 dark:text-purple-400">매출</span>
              </div>
              <h3 className="text-2xl font-bold dark:text-white mb-1">
                {formatCurrency(currentDeviceData.summary.totalRevenue)}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">총 매출</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
                <span className="text-sm text-yellow-600 dark:text-yellow-400">평균</span>
              </div>
              <h3 className="text-2xl font-bold dark:text-white mb-1">
                {formatCurrency(currentDeviceData.summary.avgRevenuePerReservation)}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">예약당 매출</p>
            </motion.div>
          </div>

          {/* 상세 분석 차트들 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 시간대별 예약 패턴 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold dark:text-white">시간대별 예약 패턴</h2>
                <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              
              <div className="space-y-4">
                {currentDeviceData.hourlyBookings?.map((slot, index) => (
                  <div key={slot.timeSlot} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{slot.timeSlot}시</span>
                      <span className="font-medium dark:text-white">
                        {slot.count}건 ({slot.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${slot.percentage}%` }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* 기기 번호별 사용 빈도 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold dark:text-white">기기별 사용 빈도</h2>
                <Target className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              
              <div className="space-y-3">
                {currentDeviceData.deviceUsage?.slice(0, 5).map((device) => (
                  <div key={device.deviceNumber} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {device.deviceNumber}
                      </div>
                      <span className="font-medium dark:text-white">{device.deviceNumber}번기</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold dark:text-white">{device.count}회</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{device.percentage}%</p>
                    </div>
                  </div>
                ))}
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
                <h2 className="text-lg font-semibold dark:text-white">예약 상태 분석</h2>
                <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium dark:text-white">완료</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">
                    {currentDeviceData.statusRates.completion.toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium dark:text-white">취소</span>
                  </div>
                  <span className="text-xl font-bold text-red-600">
                    {currentDeviceData.statusRates.cancellation.toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium dark:text-white">노쇼</span>
                  </div>
                  <span className="text-xl font-bold text-yellow-600">
                    {currentDeviceData.statusRates.noShow.toFixed(1)}%
                  </span>
                </div>
              </div>
            </motion.div>

            {/* 환불 현황 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold dark:text-white">환불 현황</h2>
                <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              
              <div className="text-center py-8">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {formatCurrency(currentDeviceData.summary.totalRefunds)}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">총 환불 금액</p>
                
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">환불율</span>
                    <span className="font-medium dark:text-white">
                      {currentDeviceData.summary.totalRevenue > 0 
                        ? ((currentDeviceData.summary.totalRefunds / currentDeviceData.summary.totalRevenue) * 100).toFixed(2)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 크레딧 옵션 분석 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold dark:text-white">크레딧 옵션 분석</h2>
                <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              
              <div className="space-y-4">
                {currentDeviceData.creditAnalysis?.map((credit, index) => {
                  const getCreditLabel = (type: string) => {
                    switch (type) {
                      case 'freeplay': return '프리플레이';
                      case 'fixed': return '고정크레딧';
                      case 'unlimited': return '무한크레딧';
                      default: return type;
                    }
                  };

                  const getCreditColor = (type: string) => {
                    switch (type) {
                      case 'freeplay': return 'from-blue-500 to-cyan-500';
                      case 'fixed': return 'from-green-500 to-emerald-500';
                      case 'unlimited': return 'from-purple-500 to-violet-500';
                      default: return 'from-gray-500 to-gray-600';
                    }
                  };

                  return (
                    <div key={credit.type} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{getCreditLabel(credit.type)}</span>
                        <div className="text-right">
                          <span className="font-medium dark:text-white">
                            {credit.count}건 ({credit.percentage}%)
                          </span>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(credit.revenue)}
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${credit.percentage}%` }}
                          transition={{ delay: 0.9 + index * 0.1 }}
                          className={`h-2 bg-gradient-to-r ${getCreditColor(credit.type)} rounded-full`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          {isLoading ? '데이터 로딩 중...' : '데이터가 없습니다'}
        </div>
      )}
    </div>
  );
}