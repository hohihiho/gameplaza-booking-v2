// 관리자 대시보드
// 비전공자 설명: 관리자 메인 페이지로 전체 현황을 한눈에 볼 수 있습니다
'use client';

import Link from 'next/link';
import {
  Calendar,
  Gamepad2,
  Clock,
  ChevronRight,
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
  Bell,
  Settings,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import RealtimeDeviceWidget from './components/RealtimeDeviceWidget';
import RealtimeReservationWidget from './components/RealtimeReservationWidget';

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
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'checked_in' | 'completed' | 'no_show';
  created_at: string;
};

type DashboardData = {
  stats: {
    revenue: { value: number; trend: number };
    reservations: { total: number; pending: number; trend: number };
    currentlyUsing: { using: number; waiting: number };
    devices: { available: number; total: number; maintenance: number };
  };
  recentReservations: RecentReservation[];
  pendingPayments: number;
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('[AdminDashboard] useEffect 실행됨 - fetchDashboardData 호출');
    fetchDashboardData();
    
    // 자동 새로고침 제거 - 사용자가 수동으로 새로고침하면 데이터 갱신됨
    // const interval = setInterval(fetchDashboardData, 30000);
    
    return () => {
      console.log('[AdminDashboard] useEffect cleanup 실행됨');
      // clearInterval(interval);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...');
      const response = await fetch('/api/admin/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 쿠키 포함
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const dashboardData = await response.json();
      console.log('Dashboard data received:', dashboardData);
      setData(dashboardData);
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  // 통계 데이터 형식화
  const stats: StatCard[] = [
    {
      title: '오늘 대여 매출',
      value: `₩${data.stats.revenue.value.toLocaleString()}`,
      subtext: '실제 이용시간 기준',
      icon: DollarSign,
      trend: data.stats.revenue.trend ? { 
        value: Math.abs(data.stats.revenue.trend), 
        isUp: data.stats.revenue.trend > 0 
      } : undefined,
      color: 'bg-emerald-500',
      link: '/admin/analytics/revenue'
    },
    {
      title: '오늘 예약',
      value: data.stats.reservations.total,
      subtext: data.stats.reservations.pending > 0 
        ? `승인 대기 ${data.stats.reservations.pending}건` 
        : '모두 처리됨',
      icon: Calendar,
      trend: data.stats.reservations.trend ? { 
        value: Math.abs(data.stats.reservations.trend), 
        isUp: data.stats.reservations.trend > 0 
      } : undefined,
      color: 'bg-blue-500',
      link: '/admin/reservations'
    },
    {
      title: '현재 이용중',
      value: data.stats.currentlyUsing.using,
      subtext: data.stats.currentlyUsing.waiting > 0 
        ? `체크인 대기 ${data.stats.currentlyUsing.waiting}명` 
        : '대기 없음',
      icon: UserCheck,
      color: 'bg-green-500',
      link: '/admin/checkin'
    },
    {
      title: '대여 가능',
      value: `${data.stats.devices.available}/${data.stats.devices.total}`,
      subtext: data.stats.devices.maintenance > 0 
        ? `점검중 ${data.stats.devices.maintenance}대` 
        : '모두 정상',
      icon: Activity,
      color: 'bg-purple-500',
      link: '/admin/devices'
    }
  ];

  // 최근 예약
  const recentReservations = data.recentReservations;

  // 결제 대기 현황
  const pendingPayments = data.pendingPayments;

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      {/* 배경 장식 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl" />
      </div>
      
      <div className="relative">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-2">
            관리자 대시보드
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            전체 현황을 한눈에 확인하고 관리합니다
          </p>
        </div>

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
                {data.stats.reservations.pending > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                    {data.stats.reservations.pending}
                  </span>
                )}
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
            
            <Link
              href="/admin/schedule"
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 hover:from-indigo-100 hover:to-indigo-200 dark:hover:from-indigo-800/30 dark:hover:to-indigo-700/30 transition-all group"
            >
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">일정관리</span>
            </Link>
            
            <Link
              href="/admin/reservations/on-behalf"
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-800/30 dark:hover:to-emerald-700/30 transition-all group"
            >
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">대리예약</span>
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
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity`} />
                  
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

        {/* 실시간 위젯 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <RealtimeDeviceWidget />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <RealtimeReservationWidget />
          </motion.div>
        </div>

        {/* 빠른 작업 - 데스크톱에서만 표시 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
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
                {(data.stats.currentlyUsing.waiting > 0 || pendingPayments > 0) && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                    {data.stats.currentlyUsing.waiting + pendingPayments}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                체크인 관리
                {data.stats.currentlyUsing.waiting > 0 && (
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {data.stats.currentlyUsing.waiting}명 대기중
                  </span>
                )}
              </span>
            </Link>
            
            <Link
              href="/admin/reservations?status=pending"
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 hover:from-yellow-100 hover:to-yellow-200 dark:hover:from-yellow-800/30 dark:hover:to-yellow-700/30 transition-all group"
            >
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg">
                  <Timer className="w-6 h-6 text-white" />
                </div>
                {data.stats.reservations.pending > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                    {data.stats.reservations.pending}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center">예약 승인</span>
            </Link>
            
            <Link
              href="/admin/reservations/on-behalf"
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-800/30 dark:hover:to-emerald-700/30 transition-all group"
            >
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center">대리 예약</span>
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
              href="/admin/schedule"
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-r from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 hover:from-cyan-100 hover:to-cyan-200 dark:hover:from-cyan-800/30 dark:hover:to-cyan-700/30 transition-all group"
            >
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center">일정 관리</span>
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

        {/* 최근 예약 목록 */}
        {recentReservations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                최근 예약
              </h2>
              <Link
                href="/admin/reservations"
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
              >
                전체 보기
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentReservations.map((reservation) => {
                const statusConfig = {
                  pending: { text: '대기중', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
                  approved: { text: '승인됨', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
                  rejected: { text: '거절됨', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
                  cancelled: { text: '취소됨', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
                  checked_in: { text: '체크인', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
                  completed: { text: '완료됨', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
                  no_show: { text: '노쇼', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
                };
                const status = statusConfig[reservation.status];
                
                return (
                  <div
                    key={reservation.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {reservation.user_name}
                        </p>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${status.color}`}>
                          {status.text}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {reservation.device_name} • {reservation.date} {reservation.time}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {reservation.created_at}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}