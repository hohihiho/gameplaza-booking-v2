// 예약 완료 페이지 컨텐츠
// 비전공자 설명: 예약이 성공적으로 완료되었을 때 보여주는 페이지의 실제 내용입니다
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, Clock, Hash, Home, List, Gamepad2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/db';
import { formatTimeKST, parseKSTDate } from '@/lib/utils/kst-date';
import { useReservationStore } from '@/app/store/reservation-store';
import { useSession } from 'next-auth/react';

export default function ReservationCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlReservationId = searchParams.get('id');
  const { lastReservationId } = useReservationStore();
  const [reservation, setReservation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supabase] = useState(() => createClient());
  const { data: session, status } = useSession();
  
  // URL 파라미터가 있으면 우선 사용, 없으면 store에서 가져옴
  const reservationId = urlReservationId || lastReservationId;

  // 컴포넌트 마운트 로깅
  useEffect(() => {
    console.log('=== 예약 완료 페이지 마운트 ===');
    console.log('URL 예약 ID:', urlReservationId);
    console.log('Store 예약 ID:', lastReservationId);
    console.log('최종 예약 ID:', reservationId);
    console.log('현재 경로:', window.location.pathname);
    console.log('세션 상태:', status);
    console.log('세션 데이터:', session);
    console.log('=========================');

    // 언마운트 시 로깅
    return () => {
      console.log('=== 예약 완료 페이지 언마운트 ===');
      console.log('언마운트 시점 경로:', window.location.pathname);
    };
  }, []);

  useEffect(() => {
    if (!reservationId) {
      console.log('예약 ID가 없습니다.');
      // 리다이렉트 제거 - 단순히 에러 메시지만 표시
      setIsLoading(false);
      return;
    }

    console.log('예약 완료 페이지 - 예약 ID:', reservationId);
    loadReservation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId]);

  const loadReservation = async () => {
    try {
      console.log('예약 정보 로드 시작 - ID:', reservationId);
      
      // 예약 정보와 관련 데이터를 한 번에 가져오기
      const { data, error } = await supabase.from('reservations')
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
          )
        `)
        .eq('id', reservationId)
        .maybeSingle(); // single() 대신 maybeSingle() 사용

      if (error) {
        console.error('예약 정보 로드 에러:', error);
        // 에러가 나도 페이지는 유지
        setReservation(null);
      } else if (!data) {
        console.log('예약 정보를 찾을 수 없습니다');
        setReservation(null);
      } else {
        console.log('예약 데이터 로드 성공:', data);
        setReservation(data);
      }
    } catch (error) {
      console.error('예약 정보 로드 실패:', error);
      setReservation(null);
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">예약 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 예약 ID가 없는 경우
  if (!reservationId) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-5 py-8 w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg text-center"
          >
            <AlertCircle className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold dark:text-white mb-2">예약 정보를 찾을 수 없습니다</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              예약 정보가 없거나 만료되었습니다.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                홈으로
              </button>
              <button
                onClick={() => router.push('/reservations')}
                className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                내 예약 보기
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-5 py-8 w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg"
        >
          {/* 성공 아이콘 */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-4"
            >
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </motion.div>
            <h1 className="text-2xl font-bold dark:text-white">예약이 접수되었습니다!</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              관리자 승인을 기다려주세요
            </p>
          </div>

          {reservation ? (
            <>
              {/* 예약 정보 */}
              <div className="space-y-4 border-t border-gray-200 dark:border-gray-800 pt-6">
            <div className="flex items-start gap-3">
              <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">예약번호</p>
                <p className="font-medium dark:text-white">{reservation.reservation_number}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Gamepad2 className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
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
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">대여 날짜</p>
                <p className="font-medium dark:text-white">{formatDate(reservation.date)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">대여 시간</p>
                <p className="font-medium dark:text-white">
                  {formatTime(reservation.start_time, reservation.end_time)} ({calculateDuration(reservation.start_time, reservation.end_time)}시간)
                </p>
              </div>
            </div>
          </div>

              {/* 안내 메시지 */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • 예약 승인 시 알림을 받으실 수 있습니다<br />
                  • 대여 시간 24시간 전까지 취소 가능합니다<br />
                  • 문의사항은 오픈채팅으로 연락주세요
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                예약이 성공적으로 접수되었습니다.
              </p>
            </div>
          )}

          {/* 버튼 */}
          <div className="grid grid-cols-2 gap-3 mt-8">
            <button
              onClick={() => router.push('/')}
              className="py-3 px-4 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              홈으로
            </button>
            <button
              onClick={() => router.push('/reservations')}
              className="py-3 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <List className="w-4 h-4" />
              내 예약 보기
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}