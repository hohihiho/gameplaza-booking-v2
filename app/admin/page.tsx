// 관리자 대시보드
// 비전공자 설명: 관리자 메인 페이지로 전체 현황을 한눈에 볼 수 있습니다
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Users, 
  Gamepad2, 
  Clock,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  CheckCircle,
  XCircle,
  Timer
} from 'lucide-react';
// framer-motion 제거됨

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
};

type RecentReservation = {
  id: string;
  user_name: string;
  device_name: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  created_at: string;
};

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // 통계 데이터 (실제로는 API에서 가져옴)
  const stats: StatCard[] = [
    {
      title: '오늘 예약',
      value: 12,
      subtext: '승인 대기 3건',
      icon: Calendar,
      trend: { value: 20, isUp: true },
      color: 'bg-blue-500'
    },
    {
      title: '활성 회원',
      value: 156,
      subtext: '이번 달 신규 12명',
      icon: Users,
      trend: { value: 8, isUp: true },
      color: 'bg-green-500'
    },
    {
      title: '가동 기기',
      value: '18/20',
      subtext: '가동률 90%',
      icon: Gamepad2,
      color: 'bg-purple-500'
    },
    {
      title: '평균 이용시간',
      value: '2.5시간',
      subtext: '전주 대비 +15분',
      icon: Clock,
      trend: { value: 10, isUp: true },
      color: 'bg-orange-500'
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
      status: 'approved',
      created_at: '30분 전'
    },
    {
      id: '3',
      user_name: '박민수',
      device_name: '춘리즘 #1',
      date: '2024-01-27',
      time: '10:00-12:00',
      status: 'pending',
      created_at: '1시간 전'
    }
  ];

  const handleRefresh = () => {
    setIsLoading(true);
    // API 호출 시뮬레이션
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
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="w-3 h-3" />
            승인됨
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold dark:text-white">대시보드</h1>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          마지막 업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                  <Icon className={`w-6 h-6 text-white`} style={{ color: stat.color.replace('bg-', '') }} />
                </div>
                {stat.trend && (
                  <div className={`flex items-center gap-1 text-sm ${stat.trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className={`w-4 h-4 ${!stat.trend.isUp ? 'rotate-180' : ''}`} />
                    {stat.trend.value}%
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-bold dark:text-white mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
              {stat.subtext && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{stat.subtext}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* 빠른 작업 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-fade-in"
          style={{ animationDelay: '400ms' }}
        >
          <h2 className="text-lg font-semibold dark:text-white mb-4">빠른 작업</h2>
          <div className="space-y-3">
            <Link
              href="/admin/time-slots"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium dark:text-white">시간대 추가</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link
              href="/admin/devices"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Gamepad2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium dark:text-white">기기 관리</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link
              href="/admin/rental-devices"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Gamepad2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium dark:text-white">대여기기관리</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium dark:text-white">회원 조회</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
          </div>
        </div>

        {/* 최근 예약 */}
        <div
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-fade-in"
          style={{ animationDelay: '500ms' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold dark:text-white">최근 예약</h2>
            <Link
              href="/admin/reservations"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              전체보기
            </Link>
          </div>
          <div className="space-y-3">
            {recentReservations.map((reservation) => (
              <div
                key={reservation.id}
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
                    <button className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 알림 */}
      <div
        className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 animate-fade-in"
        style={{ animationDelay: '600ms' }}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
              승인 대기중인 예약이 있습니다
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              3건의 예약이 승인을 기다리고 있습니다. 빠른 처리 부탁드립니다.
            </p>
          </div>
          <Link
            href="/admin/reservations?status=pending"
            className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            확인하기
          </Link>
        </div>
      </div>
    </div>
  );
}