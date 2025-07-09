// 관리자 대시보드
// 비전공자 설명: 관리자 메인 페이지로 전체 현황을 한눈에 볼 수 있습니다
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Gamepad2, 
  Clock,
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
  ArrowDown,
  BarChart3,
  FileText,
  TrendingUp,
  Shield,
  Bell,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [_lastUpdated, setLastUpdated] = useState(new Date());
  
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
      title: '오늘 대여 매출',
      value: '₩485,000',
      subtext: '실제 이용시간 기준',
      icon: DollarSign,
      trend: { value: 15, isUp: true },
      color: 'bg-emerald-500',
      link: '/admin/analytics/revenue'
    },
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 dark:from-yellow-900/30 dark:to-yellow-800/30 dark:text-yellow-400 shadow-sm">
            <Timer className="w-3 h-3" />
            대기중
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 dark:from-blue-900/30 dark:to-blue-800/30 dark:text-blue-400 shadow-sm">
            <CheckCircle className="w-3 h-3" />
            승인됨
          </span>
        );
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-green-200 text-green-800 dark:from-green-900/30 dark:to-green-800/30 dark:text-green-400 shadow-sm">
            <Zap className="w-3 h-3" />
            이용중
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-red-100 to-red-200 text-red-800 dark:from-red-900/30 dark:to-red-800/30 dark:text-red-400 shadow-sm">
            <XCircle className="w-3 h-3" />
            거절됨
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-700/30 dark:to-gray-600/30 dark:text-gray-400 shadow-sm">
            <XCircle className="w-3 h-3" />
            취소됨
          </span>
        );
    }
  };


  // 결제 대기 현황
  const pendingPayments = 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* 배경 장식 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl" />
      </div>
      
      <div className="relative p-6 max-w-7xl mx-auto">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    관리자 대시보드
                  </h1>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {currentTime.toLocaleDateString('ko-KR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                  <span className="text-gray-400 dark:text-gray-600">•</span>
                  <Clock className="w-4 h-4" />
                  {currentTime.toLocaleTimeString('ko-KR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              <motion.button
                onClick={handleRefresh}
                disabled={isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center p-2.5 text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                title="새로고침"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* 처리 대기중인 항목 - 모든 화면에서 최상단에 표시 */}
        <AnimatePresence>
          {(pendingPayments > 0 || recentReservations.filter(r => r.status === 'pending').length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
              className="relative overflow-hidden bg-gradient-to-r from-yellow-500/10 to-orange-500/10 dark:from-yellow-500/20 dark:to-orange-500/20 backdrop-blur-xl border border-yellow-500/20 dark:border-yellow-500/30 rounded-3xl p-6 mb-8"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 to-orange-400/5 animate-pulse" />
              
              <div className="relative flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl shadow-lg">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                    처리 대기중인 항목
                  </h3>
                  <div className="space-y-2 mb-4">
                    {recentReservations.filter(r => r.status === 'pending').length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                        <span className="font-medium">{recentReservations.filter(r => r.status === 'pending').length}건</span>의 예약이 승인 대기중
                      </div>
                    )}
                    {pendingPayments > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                        <span className="font-medium">{pendingPayments}건</span>의 계좌이체 확인 필요
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {recentReservations.filter(r => r.status === 'pending').length > 0 && (
                      <Link
                        href="/admin/reservations?status=pending"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-sm font-medium rounded-2xl hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-lg hover:shadow-xl"
                      >
                        <CheckSquare className="w-4 h-4" />
                        예약 확인
                      </Link>
                    )}
                    {pendingPayments > 0 && (
                      <Link
                        href="/admin/checkin"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-medium rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl"
                      >
                        <UserCheck className="w-4 h-4" />
                        체크인 확인
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 빠른 작업 - 모바일에서만 표시 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6 mb-8"
        >
          <h2 className="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            빠른 작업
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/admin/checkin"
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-800/30 dark:hover:to-orange-700/30 transition-all group"
            >
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                {pendingPayments > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                    {pendingPayments}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">체크인</span>
            </Link>
            
            <Link
              href="/admin/reservations?status=pending"
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 hover:from-yellow-100 hover:to-yellow-200 dark:hover:from-yellow-800/30 dark:hover:to-yellow-700/30 transition-all group"
            >
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg">
                  <Timer className="w-6 h-6 text-white" />
                </div>
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                  3
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">예약승인</span>
            </Link>
            
            <Link
              href="/admin/devices"
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-800/30 dark:hover:to-purple-700/30 transition-all group"
            >
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">기기관리</span>
            </Link>
            
            <Link
              href="/admin/analytics/reservations"
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/30 dark:hover:to-blue-700/30 transition-all group"
            >
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">통계분석</span>
            </Link>
          </div>
        </motion.div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const colors = {
              'bg-blue-500': 'from-blue-500 to-blue-600',
              'bg-green-500': 'from-green-500 to-green-600', 
              'bg-emerald-500': 'from-emerald-500 to-emerald-600',
              'bg-purple-500': 'from-purple-500 to-purple-600'
            };
            const gradient = colors[stat.color as keyof typeof colors];
            
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="relative group"
              >
                <Link
                  href={stat.link || '#'}
                  className="block bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-2xl transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity" />
                  
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 bg-gradient-to-br ${gradient} rounded-2xl shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      {stat.trend && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.2 }}
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            stat.trend.isUp 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {stat.trend.isUp ? <TrendingUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                          {stat.trend.value}%
                        </motion.div>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        {stat.value}
                      </h3>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.title}</p>
                      {stat.subtext && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{stat.subtext}</p>
                      )}
                    </div>
                    
                    <motion.div 
                      className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all"
                    >
                      <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                        <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                    </motion.div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* 빠른 작업 - 데스크톱에서만 표시 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="hidden lg:block bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
        >
          <h2 className="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            빠른 작업
          </h2>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <Link
              href="/admin/checkin"
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-800/30 dark:hover:to-orange-700/30 transition-all group"
            >
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                {pendingPayments > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                    {pendingPayments}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center">체크인 관리</span>
            </Link>
            
            <Link
              href="/admin/reservations?status=pending"
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 hover:from-yellow-100 hover:to-yellow-200 dark:hover:from-yellow-800/30 dark:hover:to-yellow-700/30 transition-all group"
            >
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg">
                  <Timer className="w-6 h-6 text-white" />
                </div>
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                  3
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center">예약 승인</span>
            </Link>
            
            <Link
              href="/admin/devices"
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-800/30 dark:hover:to-purple-700/30 transition-all group"
            >
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center">기기 관리</span>
            </Link>
            
            <Link
              href="/admin/analytics/reservations"
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/30 dark:hover:to-blue-700/30 transition-all group"
            >
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center">통계 분석</span>
            </Link>
            
            <Link
              href="/admin/rental-devices"
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 hover:from-indigo-100 hover:to-indigo-200 dark:hover:from-indigo-800/30 dark:hover:to-indigo-700/30 transition-all group"
            >
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center">대여기기관리</span>
            </Link>
            
            <Link
              href="/admin/content"
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 hover:from-green-100 hover:to-green-200 dark:hover:from-green-800/30 dark:hover:to-green-700/30 transition-all group"
            >
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                <CheckSquare className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center">콘텐츠 관리</span>
            </Link>
            
            <Link
              href="/admin/terms"
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/20 dark:to-gray-600/20 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600/30 dark:hover:to-gray-500/30 transition-all group"
            >
              <div className="p-3 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center">약관 관리</span>
            </Link>
            
            <Link
              href="/admin/settings"
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700/20 dark:to-slate-600/20 hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-600/30 dark:hover:to-slate-500/30 transition-all group"
            >
              <div className="p-3 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl shadow-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center">환경설정</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}