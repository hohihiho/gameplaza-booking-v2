// 관리자 대시보드
// 비전공자 설명: 관리자 메인 페이지로 전체 현황을 한눈에 볼 수 있습니다
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Gamepad2, 
  Clock,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  CheckCircle,
  XCircle,
  Timer,
  DollarSign,
  Activity,
  CheckSquare,
  Zap,
  UserCheck,
  ArrowUp,
  ArrowDown,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';

type StatCard = {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color: string;
  link?: string;
};

type RecentReservation = {
  id: string;
  user_name: string;
  device_name: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'checked_in';
  created_at: string;
};

type DeviceStatus = {
  id: string;
  name: string;
  status: 'available' | 'in_use' | 'maintenance';
  current_user?: string;
  end_time?: string;
};

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [deviceStatuses, setDeviceStatuses] = useState<DeviceStatus[]>([]);
  
  // 1초마다 현재 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);


  // 통계 데이터 (실제로는 API에서 가져옴)
  const stats: StatCard[] = [
    {
      title: '오늘 예약',
      value: 18,
      subtext: '승인 대기 3건',
      icon: Calendar,
      trend: { value: 20, isUp: true },
      color: 'bg-blue-500',
      link: '/admin/reservations'
    },
    {
      title: '현재 이용중',
      value: 8,
      subtext: '체크인 대기 2명',
      icon: UserCheck,
      color: 'bg-green-500',
      link: '/admin/checkin'
    },
    {
      title: '오늘 매출',
      value: '₩485,000',
      subtext: '실제 이용시간 기준',
      icon: DollarSign,
      trend: { value: 15, isUp: true },
      color: 'bg-emerald-500',
      link: '/admin/sales'
    },
    {
      title: '대여 가능',
      value: '15/20',
      subtext: '점검중 2대',
      icon: Activity,
      color: 'bg-purple-500',
      link: '/admin/devices'
    }
  ];

  // 최근 예약 (실제로는 API에서 가져옴)
  const recentReservations: RecentReservation[] = [
    {
      id: '1',
      user_name: '김철수',
      device_name: '마이마이 DX #1',
      date: '2024-01-26',
      time: '14:00-16:00',
      status: 'pending',
      created_at: '10분 전'
    },
    {
      id: '2',
      user_name: '이영희',
      device_name: '사운드 볼텍스 #2',
      date: '2024-01-26',
      time: '16:00-18:00',
      status: 'checked_in',
      created_at: '30분 전'
    },
    {
      id: '3',
      user_name: '박민수',
      device_name: '춘리즘 #1',
      date: '2024-01-27',
      time: '10:00-12:00',
      status: 'approved',
      created_at: '1시간 전'
    },
    {
      id: '4',
      user_name: '정수연',
      device_name: '태고의달인 #1',
      date: '2024-01-26',
      time: '20:00-22:00',
      status: 'pending',
      created_at: '2시간 전'
    }
  ];

  // 기기 상태 (실제로는 API에서 가져옴)
  useEffect(() => {
    setDeviceStatuses([
      { id: '1', name: '마이마이 DX #1', status: 'in_use', current_user: '김철수', end_time: '16:00' },
      { id: '3', name: '사운드 볼텍스 #1', status: 'maintenance' },
      { id: '4', name: '사운드 볼텍스 #2', status: 'in_use', current_user: '이영희', end_time: '18:00' },
      { id: '6', name: '태고의달인 #2', status: 'maintenance' },
      { id: '7', name: '춘리즘 #2', status: 'in_use', current_user: '박민수', end_time: '17:00' },
    ]);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsLoading(false);
    }, 1000);
  };

  const getStatusBadge = (status: RecentReservation['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
            <Timer className="w-3 h-3" />
            대기중
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            <CheckCircle className="w-3 h-3" />
            승인됨
          </span>
        );
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <Zap className="w-3 h-3" />
            이용중
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            <XCircle className="w-3 h-3" />
            거절됨
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
            <XCircle className="w-3 h-3" />
            취소됨
          </span>
        );
    }
  };

  const getDeviceStatusColor = (status: DeviceStatus['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'in_use':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800';
    }
  };

  // 시간대별 예약 현황 (실제로는 API에서 가져옴)
  const timeSlotData = [
    { time: '10:00', count: 2, max: 8 },
    { time: '12:00', count: 5, max: 8 },
    { time: '14:00', count: 8, max: 8 },
    { time: '16:00', count: 6, max: 8 },
    { time: '18:00', count: 4, max: 8 },
    { time: '20:00', count: 3, max: 8 },
    { time: '22:00', count: 1, max: 8 },
  ];

  // 결제 대기 현황
  const pendingPayments = 3;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold dark:text-white">대시보드</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
              {currentTime.toLocaleDateString('ko-KR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} {currentTime.toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <Link
                href={stat.link || '#'}
                className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                    <Icon className={`w-6 h-6 text-white`} style={{ color: stat.color.replace('bg-', '') }} />
                  </div>
                  {stat.trend && (
                    <div className={`flex items-center gap-1 text-sm ${stat.trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.trend.isUp ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                      {stat.trend.value}%
                    </div>
                  )}
                </div>
                <h3 className="text-2xl font-bold dark:text-white mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                {stat.subtext && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{stat.subtext}</p>
                )}
                {stat.link && (
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* 실시간 현황 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 시간대별 예약 현황 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <h2 className="text-lg font-semibold dark:text-white mb-4">오늘의 시간대별 예약 현황</h2>
          <div className="space-y-3">
            {timeSlotData.map((slot) => {
              const percentage = (slot.count / slot.max) * 100;
              const isFull = slot.count === slot.max;
              
              return (
                <div key={slot.time} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{slot.time}</span>
                    <span className={`font-medium ${isFull ? 'text-red-600 dark:text-red-400' : 'dark:text-white'}`}>
                      {slot.count}/{slot.max} {isFull && '(만석)'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isFull 
                          ? 'bg-red-500' 
                          : percentage > 75 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 기기 상태 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold dark:text-white">기기 상태</h2>
            <Link
              href="/admin/devices"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              전체보기
            </Link>
          </div>
          <div className="space-y-2">
            {deviceStatuses.map((device) => (
              <div
                key={device.id}
                className={`p-3 rounded-lg border ${getDeviceStatusColor(device.status)}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{device.name}</span>
                  {device.status === 'in_use' && device.end_time && (
                    <span className="text-xs">~{device.end_time}</span>
                  )}
                </div>
                {device.current_user && (
                  <p className="text-xs mt-1 opacity-80">{device.current_user}</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 빠른 작업 & 최근 예약 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 빠른 작업 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <h2 className="text-lg font-semibold dark:text-white mb-4">빠른 작업</h2>
          <div className="space-y-3">
            <Link
              href="/admin/checkin"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <CheckSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium dark:text-white">체크인 관리</span>
              </div>
              <div className="flex items-center gap-2">
                {pendingPayments > 0 && (
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 text-xs rounded-full">
                    {pendingPayments}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            <Link
              href="/admin/reservations?status=pending"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Timer className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium dark:text-white">예약 승인</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 text-xs rounded-full">
                  3
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            <Link
              href="/admin/devices"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Gamepad2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium dark:text-white">기기 관리</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/admin/rental-devices"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium dark:text-white">대여기기관리</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/admin/analytics/reservations"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium dark:text-white">통계 분석</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/admin/content"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <CheckSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium dark:text-white">콘텐츠 관리</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>

        {/* 최근 예약 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold dark:text-white">최근 활동</h2>
            <Link
              href="/admin/reservations"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              전체보기
            </Link>
          </div>
          <div className="space-y-3">
            {recentReservations.map((reservation) => (
              <motion.div
                key={reservation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium dark:text-white">{reservation.user_name}</span>
                    {getStatusBadge(reservation.status)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {reservation.device_name} • {reservation.date} {reservation.time}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {reservation.created_at}
                  </div>
                </div>
                {reservation.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/reservations?id=${reservation.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 알림 */}
      {(pendingPayments > 0 || recentReservations.filter(r => r.status === 'pending').length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                처리 대기중인 항목이 있습니다
              </h3>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                {recentReservations.filter(r => r.status === 'pending').length > 0 && (
                  <p>• {recentReservations.filter(r => r.status === 'pending').length}건의 예약이 승인을 기다리고 있습니다</p>
                )}
                {pendingPayments > 0 && (
                  <p>• {pendingPayments}건의 계좌이체 확인이 필요합니다</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {recentReservations.filter(r => r.status === 'pending').length > 0 && (
                <Link
                  href="/admin/reservations?status=pending"
                  className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  예약 확인
                </Link>
              )}
              {pendingPayments > 0 && (
                <Link
                  href="/admin/checkin"
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  체크인 확인
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}