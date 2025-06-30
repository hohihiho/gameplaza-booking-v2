// 예약 완료 페이지
'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Home, Calendar, Copy, Check } from 'lucide-react';
import { formatTimeKST, parseKSTDate } from '@/lib/utils/kst-date';

function ReservationCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  
  // URL 파라미터에서 예약 정보 추출
  const reservationId = searchParams.get('id') || '';
  const deviceName = searchParams.get('deviceName') || '';
  const date = searchParams.get('date') || '';
  const time = searchParams.get('time') || '';
  const amount = searchParams.get('amount') || '0';
  const playerCount = searchParams.get('playerCount') || '1';
  
  // 예약번호 복사 기능
  const copyReservationId = async () => {
    try {
      await navigator.clipboard.writeText(reservationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  // 날짜 포맷팅 (KST 기준)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = parseKSTDate(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };
  
  // 시간 포맷팅
  const formatTimeRange = (timeStr: string) => {
    if (!timeStr) return '';
    const parts = timeStr.split('-');
    const start = parts[0] || '';
    const end = parts[1] || '';
    return `${formatTimeKST(start)} ~ ${formatTimeKST(end)}`;
  };
  
  // 금액 포맷팅
  const formatAmount = (amountStr: string) => {
    const num = parseInt(amountStr);
    return isNaN(num) ? '0' : num.toLocaleString();
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 성공 애니메이션 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.1 
          }}
          className="flex justify-center mb-8"
        >
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
          </div>
        </motion.div>
        
        {/* 메인 타이틀 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            예약이 완료되었습니다!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            예약 정보를 확인해 주세요
          </p>
        </motion.div>
        
        {/* 예약 번호 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">예약 번호</p>
              <p className="text-xl font-mono font-bold text-gray-900 dark:text-white">
                {reservationId}
              </p>
            </div>
            <button
              onClick={copyReservationId}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="예약번호 복사"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
        </motion.div>
        
        {/* 예약 정보 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 shadow-lg"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            예약 정보
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">기기</span>
              <span className="font-medium text-gray-900 dark:text-white">{deviceName}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">날짜</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatDate(date)}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">시간</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatTimeRange(time)}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">인원</span>
              <span className="font-medium text-gray-900 dark:text-white">{playerCount}명</span>
            </div>
            
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">이용 요금</span>
              <span className="font-bold text-xl text-gray-900 dark:text-white">
                ₩{formatAmount(amount)}
              </span>
            </div>
          </div>
        </motion.div>
        
        {/* 방문 안내 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 mb-8 border border-blue-200 dark:border-blue-800"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">📍 방문 안내</h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>• 예약 시간 10분 전까지 도착해 주세요</li>
            <li>• 카운터에서 예약 번호를 제시해 주세요</li>
            <li>• 신분증을 지참해 주세요</li>
            <li>• 취소는 이용 24시간 전까지 가능합니다</li>
          </ul>
        </motion.div>
        
        {/* 네비게이션 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 gap-4"
        >
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors font-medium text-gray-900 dark:text-white"
          >
            <Home className="w-5 h-5" />
            홈으로
          </button>
          
          <button
            onClick={() => router.push('/reservations')}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 rounded-xl transition-colors font-medium text-white dark:text-gray-900"
          >
            <Calendar className="w-5 h-5" />
            예약 내역 보기
          </button>
        </motion.div>
      </div>
    </main>
  );
}

export default function ReservationCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    }>
      <ReservationCompleteContent />
    </Suspense>
  );
}