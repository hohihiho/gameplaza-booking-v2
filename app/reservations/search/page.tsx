'use client';

import { useState } from 'react';
import { supabase, supabaseAdmin } from '@/lib/db/dummy-client'; // 임시 더미 클라이언트
import { Search, Calendar, Clock, Hash, Gamepad2, AlertCircle, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
// Supabase 제거됨 - Cloudflare D1 사용
import { formatTimeKST, parseKSTDate } from '@/lib/utils/kst-date';

export default function ReservationSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [reservation, setReservation] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('예약번호를 입력해주세요');
      return;
    }

    setIsSearching(true);
    setError(null);
    setReservation(null);

    try {
      // const supabase = getDb() // D1 사용;
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          devices (
            device_number,
            device_types (
              name,
              device_categories (
                name
              )
            )
          ),
          users (
            name,
            email,
            phone
          )
        `)
        .eq('reservation_number', searchQuery.trim().toUpperCase())
        .maybeSingle();

      if (error) {
        console.error('검색 오류:', error);
        setError('예약 조회 중 오류가 발생했습니다');
      } else if (!data) {
        setError('해당 예약번호로 예약을 찾을 수 없습니다');
      } else {
        setReservation(data);
      }
    } catch (error) {
      console.error('예약 검색 실패:', error);
      setError('예약 조회 중 오류가 발생했습니다');
    } finally {
      setIsSearching(false);
    }
  };

  const formatDate = (date: string) => {
    const d = parseKSTDate(date);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
  };

  const formatTime = (startTime: string, endTime: string) => {
    return `${formatTimeKST(startTime || '')} - ${formatTimeKST(endTime || '')}`;
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const startParts = startTime.split(':').map(Number);
    const endParts = endTime.split(':').map(Number);
    const startHour = startParts[0] || 0;
    let endHour = endParts[0] || 0;
    if (endHour < startHour) endHour += 24;
    return endHour - startHour;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
      pending: {
        label: '대기중',
        icon: Clock,
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      },
      approved: {
        label: '승인됨',
        icon: CheckCircle2,
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      },
      completed: {
        label: '완료',
        icon: CheckCircle2,
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      },
      cancelled: {
        label: '취소됨',
        icon: XCircle,
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      },
      rejected: {
        label: '거절됨',
        icon: XCircle,
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    // config가 undefined인 경우 기본값 사용
    if (!config) {
      return <span className="text-gray-500">알 수 없음</span>;
    }
    
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.className}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-5 py-8">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 dark:text-white" />
          </button>
          <h1 className="text-xl font-bold dark:text-white">예약 조회</h1>
        </div>

        {/* 검색 폼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 mb-6"
        >
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="reservation-number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                예약번호로 조회
              </label>
              <div className="relative">
                <input
                  id="reservation-number"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="예: RES-20250122-001"
                  className="w-full px-4 py-3 pr-12 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white dark:bg-gray-800 dark:text-white"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                • 예약 완료 시 발급받은 예약번호를 입력하세요
              </p>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSearching ? (
                <>
                  <div className="w-5 h-5 border-2 border-white dark:border-gray-900 border-t-transparent rounded-full animate-spin" />
                  검색 중...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  조회하기
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* 검색 결과 */}
        {reservation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold dark:text-white">예약 정보</h2>
              {getStatusBadge(reservation.status)}
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">예약번호</p>
                  <p className="font-medium dark:text-white">{reservation.reservation_number}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Gamepad2 className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">기기 정보</p>
                  <p className="font-medium dark:text-white">
                    {reservation.devices?.device_types?.name || '기기'} {reservation.devices?.device_number || ''}번기
                  </p>
                  {reservation.player_count > 1 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {reservation.player_count}인 플레이
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">대여 날짜</p>
                  <p className="font-medium dark:text-white">{formatDate(reservation.date)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">대여 시간</p>
                  <p className="font-medium dark:text-white">
                    {formatTime(reservation.start_time, reservation.end_time)} ({calculateDuration(reservation.start_time, reservation.end_time)}시간)
                  </p>
                </div>
              </div>

              {/* 사용자 정보 (전화번호가 있는 경우에만 표시) */}
              {reservation.users && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">예약자 정보</p>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      이름: {reservation.users.name}
                    </p>
                    {reservation.users.phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        전화번호: {reservation.users.phone}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 안내 메시지 */}
            {reservation.status === 'pending' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mt-6">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  • 관리자 승인을 기다리고 있습니다
                </p>
              </div>
            )}

            {reservation.status === 'approved' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  • 예약이 승인되었습니다. 예약 시간에 방문해주세요
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}