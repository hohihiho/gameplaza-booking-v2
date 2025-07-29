// 개인 예약 통계 페이지
// 비전공자 설명: 사용자의 개인 예약 패턴과 통계를 분석하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar,
  Clock,
  Gamepad2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Target,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download
} from 'lucide-react';

type DateRange = '7days' | '30days' | '90days' | '12months';

export default function ReservationStatsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // 통계 데이터 로드
  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 날짜 범위를 v2 API 형식으로 변환
      const queryParams = new URLSearchParams();
      
      if (dateRange === '7days') {
        queryParams.set('periodType', 'custom');
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        queryParams.set('startDate', startDate.toISOString().split('T')[0]);
        queryParams.set('endDate', endDate.toISOString().split('T')[0]);
      } else if (dateRange === '30days') {
        queryParams.set('periodType', 'month');
        const now = new Date();
        queryParams.set('year', now.getFullYear().toString());
        queryParams.set('month', (now.getMonth() + 1).toString());
      } else if (dateRange === '90days') {
        queryParams.set('periodType', 'custom');
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 90);
        queryParams.set('startDate', startDate.toISOString().split('T')[0]);
        queryParams.set('endDate', endDate.toISOString().split('T')[0]);
      } else if (dateRange === '12months') {
        queryParams.set('periodType', 'custom');
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 1);
        queryParams.set('startDate', startDate.toISOString().split('T')[0]);
        queryParams.set('endDate', endDate.toISOString().split('T')[0]);
      }
      
      const response = await fetch(`/api/v2/statistics/reservations?${queryParams.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('통계 API 에러:', { status: response.status, errorData });
        const errorMessage = errorData.message || errorData.error || '통계 데이터를 불러올 수 없습니다';
        const errorDetails = errorData.details ? ` (${errorData.details})` : '';
        throw new Error(errorMessage + errorDetails);
      }

      const data = await response.json();
      console.log('통계 API 응답:', data);
      
      // v2 API 응답 형식 처리
      if (data.statistics) {
        console.log('통계 데이터 설정:', data.statistics);
        setStats(data.statistics);
      } else {
        const errorMessage = data.error || '통계 데이터 로드 실패';
        const errorDetails = data.details ? ` (${data.details})` : '';
        throw new Error(errorMessage + errorDetails);
      }
    } catch (error: any) {
      console.error('통계 로드 오류:', error);
      setError(error.message || '통계 데이터를 불러오는 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 및 날짜 범위 변경 시 데이터 로드
  useEffect(() => {
    loadStats();
  }, [dateRange]);

  // 기본값 설정 (로딩 중이거나 데이터가 없을 때)
  const reservationStats = stats ? {
    totalReservations: stats.totalReservations || 0,
    completedReservations: stats.completedReservations || 0,
    avgSessionTime: Math.round((stats.averageReservationDuration || 0) * 10) / 10, // 소수점 1자리까지
    totalSpent: stats.totalRevenue || 0,
    favoriteDevice: '데이터 없음'
  } : {
    totalReservations: 0,
    completedReservations: 0,
    avgSessionTime: 0,
    totalSpent: 0,
    favoriteDevice: '데이터 없음'
  };

  const monthlyData = stats?.monthlyData || [];
  const preferredHours = stats?.preferredHours || [];
  const deviceUsage = stats?.deviceUsage || [];
  const weekdayPattern = stats?.weekdayPattern || [];

  // 디버깅용 로그
  console.log('렌더링 시점 stats:', stats);
  console.log('렌더링 시점 reservationStats:', reservationStats);

  const handleRefresh = () => {
    loadStats();
  };

  const handleExport = () => {
    if (!stats) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }
    
    // CSV 형태로 데이터 내보내기
    const csvData = [
      ['구분', '값'],
      ['총 완료 예약수', reservationStats.totalReservations],
      ['평균 이용시간', `${reservationStats.avgSessionTime}시간`],
      ['총 사용금액', `${(reservationStats.totalSpent || 0).toLocaleString()}원`],
      ['선호 기기', reservationStats.favoriteDevice]
    ];
    
    const csvString = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `예약통계_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* 에러 메시지 */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-6"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <button
                onClick={handleRefresh}
                className="text-sm text-red-600 dark:text-red-400 hover:underline mt-1"
              >
                다시 시도
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 필터 및 액션 */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 기간 선택 */}
          <div className="flex-1 flex flex-wrap gap-2">
            {(['7days', '30days', '90days', '12months'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-indigo-600 text-white'
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-2xl font-bold dark:text-white mb-1">
            {reservationStats.totalReservations}건
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">완료된 예약</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            누적 이용 횟수
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold dark:text-white mb-1">
            {reservationStats.avgSessionTime}시간
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">평균 이용시간</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            회당 평균 시간
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Award className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-2xl font-bold dark:text-white mb-1">
            ₩{(reservationStats.totalSpent || 0).toLocaleString()}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">총 사용금액</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            누적 결제 금액
          </p>
        </motion.div>
      </div>

      {/* 기간별 적응형 차트 및 기기별 이용 현황 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 기간별 적응형 차트 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">
              {dateRange === '12months' ? '월별 예약 추이' : 
               dateRange === '90days' ? '주별 예약 추이' :
               '일별 예약 추이'}
            </h2>
            <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          {dateRange === '12months' ? (
            // 12개월: 월별 차트
            <div className="h-64 flex items-end justify-between gap-2">
              {monthlyData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center h-full">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">데이터가 없습니다</p>
                </div>
              ) : (
                monthlyData.map((data, index) => {
                  const maxTotal = Math.max(...monthlyData.map(d => d.completed), 1);
                  const totalHeight = (data.completed / maxTotal) * 100;
                
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center"
                    title={`${data.month}: ${data.completed}건`}
                  >
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t relative" style={{ height: '200px' }}>
                      <div
                        className="absolute bottom-0 w-full bg-indigo-600 rounded-t"
                        style={{ height: `${totalHeight}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {data.month}
                    </span>
                  </div>
                );
              })
              )}
            </div>
          ) : (
            // 다른 기간: 간단한 통계 표시
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                  {reservationStats.totalReservations}
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {dateRange === '7days' ? '최근 7일간' :
                   dateRange === '30days' ? '최근 30일간' :
                   '최근 90일간'} 완료된 예약
                </p>
                {reservationStats.totalReservations > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    {dateRange === '7days' ? '일평균 ' + Math.round(reservationStats.totalReservations / 7 * 10) / 10 :
                     dateRange === '30days' ? '일평균 ' + Math.round(reservationStats.totalReservations / 30 * 10) / 10 :
                     '일평균 ' + Math.round(reservationStats.totalReservations / 90 * 10) / 10}건
                  </p>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* 기기별 이용 현황 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">선호 기기</h2>
            <Gamepad2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {deviceUsage.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 text-sm">데이터가 없습니다</p>
              </div>
            ) : (
              deviceUsage.map((device, index) => (
              <motion.div
                key={device.device}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium dark:text-white">{device.device}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      평균 {device.avgTime}시간 이용
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold dark:text-white">{device.count}회</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {device.percentage}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                        style={{ width: `${device.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
            )}
          </div>
        </motion.div>
      </div>

      {/* 이용 패턴 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 선호 시간대 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">선호 시간대</h2>
            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {preferredHours.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 text-sm">데이터가 없습니다</p>
              </div>
            ) : (
              preferredHours.map((hour) => (
              <div key={hour.hour} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {hour.hour}시
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm dark:text-white w-8 text-right">
                    {hour.count}회
                  </span>
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      style={{ width: `${hour.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium dark:text-white w-12 text-right">
                    {hour.percentage}%
                  </span>
                </div>
              </div>
            ))
            )}
          </div>
          
          {preferredHours.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {(() => {
                  // 가장 많이 이용한 시간대 찾기
                  const topHour = preferredHours.reduce((max, current) => 
                    current.count > max.count ? current : max, preferredHours[0]
                  );
                  
                  // 시간대를 더 자연스럽게 표현
                  const hourRange = topHour.hour;
                  const [startTime, endTime] = hourRange.split('-');
                  
                  return (
                    <>
                      주로 <span className="font-medium dark:text-white">{hourRange}</span> 시간대를 선호하시는군요!
                    </>
                  );
                })()}
              </p>
            </div>
          )}
        </motion.div>

        {/* 요일별 패턴 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold dark:text-white">요일별 패턴</h2>
            <PieChart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          
          {weekdayPattern.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-sm">데이터가 없습니다</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {weekdayPattern.map((day) => (
              <div key={day.day} className="text-center">
                <div
                  className={`w-full h-16 rounded-lg flex items-end justify-center p-1 ${
                    day.percentage >= 20
                      ? 'bg-gradient-to-t from-indigo-500 to-indigo-300'
                      : day.percentage >= 15
                      ? 'bg-gradient-to-t from-indigo-400 to-indigo-200'
                      : 'bg-gradient-to-t from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-500'
                  }`}
                >
                  <span className={`text-xs font-bold ${
                    day.percentage >= 15 ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {day.count}
                  </span>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 block">
                  {day.day}
                </span>
              </div>
            ))}
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {(() => {
                    // 평일과 주말 이용 횟수 계산
                    const weekdayTotal = weekdayPattern
                      .filter(d => d.day !== '토' && d.day !== '일')
                      .reduce((sum, d) => sum + d.count, 0);
                    const weekendTotal = weekdayPattern
                      .filter(d => d.day === '토' || d.day === '일')
                      .reduce((sum, d) => sum + d.count, 0);
                    
                    // 가장 많이 이용한 요일 찾기
                    const topDay = weekdayPattern.reduce((max, current) => 
                      current.count > max.count ? current : max, weekdayPattern[0]
                    );
                    
                    if (weekdayTotal > weekendTotal) {
                      return (
                        <>
                          <span className="font-medium dark:text-white">주말보다 평일</span>에 더 자주 이용하시네요!
                          {topDay.count > 0 && ` 특히 ${topDay.day}요일을 선호하시는군요.`}
                        </>
                      );
                    } else if (weekendTotal > weekdayTotal) {
                      return (
                        <>
                          <span className="font-medium dark:text-white">평일보다 주말</span>에 더 자주 이용하시네요!
                          {topDay.count > 0 && ` 특히 ${topDay.day}요일을 선호하시는군요.`}
                        </>
                      );
                    } else {
                      return <>평일과 주말을 <span className="font-medium dark:text-white">균등하게</span> 이용하시네요!</>;
                    }
                  })()}
                </p>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}