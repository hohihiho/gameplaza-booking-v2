// 마이페이지
// 비전공자 설명: 사용자의 개인정보와 설정을 관리하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User, Bell, LogOut, UserX, ChevronRight, Edit2, Trophy, Calendar, CheckCircle, XCircle, Sparkles, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsAdmin } from '@/app/hooks/useIsAdmin';

export default function MyPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState({
    reservation: true,
    event: false, // 마케팅 동의에 따라 설정됨
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [reservationStats, setReservationStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    approved: 0,
    cancelled: 0
  });
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    if (!session?.user?.email) return;
    
    // 병렬로 데이터 로드하여 속도 개선
    const loadData = async () => {
      setIsLoading(true);
      
      const [profileResponse, statsResponse] = await Promise.allSettled([
        fetch('/api/auth/profile', { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        }),
        fetch('/api/mypage/reservation-stats', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
      ]);

      // 프로필 정보 처리
      if (profileResponse.status === 'fulfilled' && profileResponse.value.ok) {
        try {
          const data = await profileResponse.value.json();
          if (data.profile) {
            setUserProfile(data.profile);
            setNotifications({
              reservation: true,
              event: data.profile.marketing_agreed || false
            });
          }
        } catch (error) {
          console.error('프로필 로드 오류:', error);
        }
      }

      // 예약 통계 처리
      if (statsResponse.status === 'fulfilled' && statsResponse.value.ok) {
        try {
          const data = await statsResponse.value.json();
          if (data.stats) {
            setReservationStats(data.stats);
          }
        } catch (error) {
          console.error('예약 통계 로드 오류:', error);
        }
      }
      
      setIsLoading(false);
    };

    loadData();
  }, [session]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleWithdraw = async () => {
    if (isWithdrawing) return;
    
    setIsWithdrawing(true);
    try {
      const response = await fetch('/api/auth/withdraw', {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showToast('회원탈퇴가 완료되었습니다', 'success');
        setTimeout(async () => {
          await signOut({ callbackUrl: '/' });
        }, 1000);
      } else {
        showToast(data.error || '회원탈퇴 처리 중 오류가 발생했습니다', 'error');
      }
    } catch (error) {
      console.error('회원탈퇴 오류:', error);
      showToast('회원탈퇴 처리 중 오류가 발생했습니다', 'error');
    } finally {
      setIsWithdrawing(false);
      setShowWithdrawModal(false);
    }
  };

  // 토스트 표시 함수
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // 마케팅 동의 변경 처리
  const handleMarketingToggle = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    const newValue = !notifications.event;
    
    try {
      const response = await fetch('/api/mypage/update-marketing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketing_agreed: newValue
        }),
      });

      if (response.ok) {
        setNotifications({ ...notifications, event: newValue });
        showToast(
          newValue 
            ? '이벤트 및 혜택 정보 수신에 동의하였습니다.' 
            : '이벤트 및 혜택 정보 수신을 거절하였습니다.',
          'success'
        );
      } else {
        showToast('설정 변경에 실패했습니다. 다시 시도해주세요.', 'error');
        console.error('마케팅 동의 업데이트 실패');
      }
    } catch (error) {
      console.error('마케팅 동의 업데이트 오류:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* 배경 장식 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative max-w-lg lg:max-w-6xl mx-auto px-5 py-6">
        {/* 페이지 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold dark:text-white flex items-center gap-2">
            마이페이지
            <Sparkles className="w-6 h-6 text-indigo-500" />
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">내 정보와 설정을 관리하세요</p>
        </motion.div>

        {/* 프로필 섹션 */}
        {(isLoading || adminLoading) ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* 프로필 스켈레톤 */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6">
              <div className="flex items-center gap-5 mb-6">
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-32 animate-pulse" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-48 animate-pulse" />
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24 animate-pulse mt-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 animate-pulse">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 mb-2" />
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 animate-pulse">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2" />
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-28" />
                </div>
              </div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
            </div>
            
            {/* 예약 현황 스켈레톤 */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-24 mb-4 animate-pulse" />
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-5 animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8 mb-2" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                  </div>
                ))}
              </div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl mt-4 animate-pulse" />
            </div>
            
            {/* 알림 설정 스켈레톤 */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-24 mb-4 animate-pulse" />
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                      <div className="space-y-1">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                        {i === 2 && <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />}
                      </div>
                    </div>
                    <div className="w-14 h-7 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <>
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6 mb-6"
        >
          <div className="relative">
            {/* 프로필 헤더 */}
            <div className="flex items-center gap-5 mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center overflow-hidden shadow-xl">
                  {session?.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || '프로필'}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-white" />
                  )}
                </div>
                {isAdmin ? (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-lg">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl dark:text-white mb-1">
                  {userProfile?.nickname || session?.user?.name || '사용자'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{session?.user?.email || ''}</p>
                <div className="flex items-center gap-2 mt-2">
                  {isAdmin ? (
                    <>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-sm">
                        <Shield className="w-3 h-3 mr-1" />
                        관리자
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400">
                        <Trophy className="w-3 h-3 mr-1" />
                        광주겜플 멤버
                      </span>
                    </>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400">
                      <Trophy className="w-3 h-3 mr-1" />
                      광주겜플 멤버
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* 프로필 정보 카드 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">닉네임</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {userProfile?.nickname || '-'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">전화번호</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {userProfile?.phone ? 
                    `${userProfile.phone.slice(0, 3)}-${userProfile.phone.slice(3, 7)}-${userProfile.phone.slice(7)}` 
                    : '-'
                  }
                </p>
              </div>
            </div>
            
            <motion.button 
              onClick={() => router.push('/mypage/profile')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              프로필 수정
            </motion.button>
          </div>
        </motion.section>

        {/* 예약 통계 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6 mb-6"
        >
          <h2 className="text-lg font-semibold mb-4 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            예약 현황
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 p-5 rounded-2xl"
            >
              <div className="relative z-10">
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{reservationStats.total}</p>
                <p className="text-sm text-indigo-600/80 dark:text-indigo-400/80 mt-1">전체 예약</p>
              </div>
              <Trophy className="absolute -bottom-2 -right-2 w-16 h-16 text-indigo-200 dark:text-indigo-800/30" />
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative overflow-hidden bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-5 rounded-2xl"
            >
              <div className="relative z-10">
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{reservationStats.pending}</p>
                <p className="text-sm text-yellow-600/80 dark:text-yellow-400/80 mt-1">승인 대기</p>
              </div>
              <Calendar className="absolute -bottom-2 -right-2 w-16 h-16 text-yellow-200 dark:text-yellow-800/30" />
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-5 rounded-2xl"
            >
              <div className="relative z-10">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{reservationStats.approved}</p>
                <p className="text-sm text-blue-600/80 dark:text-blue-400/80 mt-1">승인됨</p>
              </div>
              <CheckCircle className="absolute -bottom-2 -right-2 w-16 h-16 text-blue-200 dark:text-blue-800/30" />
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-5 rounded-2xl"
            >
              <div className="relative z-10">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{reservationStats.completed}</p>
                <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">완료</p>
              </div>
              <CheckCircle className="absolute -bottom-2 -right-2 w-16 h-16 text-green-200 dark:text-green-800/30" />
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-5 rounded-2xl"
            >
              <div className="relative z-10">
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{reservationStats.cancelled}</p>
                <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">취소</p>
              </div>
              <XCircle className="absolute -bottom-2 -right-2 w-16 h-16 text-red-200 dark:text-red-800/30" />
            </motion.div>
          </div>
          
          <motion.button
            onClick={() => router.push('/reservations')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
          >
            내 예약 내역 보기
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </motion.section>

        {/* 알림 설정 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6 mb-6"
        >
          <h2 className="text-lg font-semibold mb-4 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-500" />
            알림 설정
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="font-medium text-gray-900 dark:text-white">예약 알림</span>
              </div>
              <button
                onClick={() => setNotifications({ ...notifications, reservation: !notifications.reservation })}
                className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                  notifications.reservation 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500' 
                    : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                <motion.div 
                  className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md"
                  animate={{ x: notifications.reservation ? 32 : 2 }}
                  transition={{ type: "spring", stiffness: 700, damping: 30 }}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">이벤트 및 혜택 알림</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    할인, 이벤트, 신규 기기 정보
                  </p>
                </div>
              </div>
              <button
                onClick={handleMarketingToggle}
                disabled={isUpdating}
                className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                  notifications.event 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                    : 'bg-gray-300 dark:bg-gray-700'
                } ${isUpdating ? 'opacity-50' : ''}`}
              >
                <motion.div 
                  className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md"
                  animate={{ x: notifications.event ? 32 : 2 }}
                  transition={{ type: "spring", stiffness: 700, damping: 30 }}
                />
              </button>
            </div>
          </div>
        </motion.section>

        {/* 계정 관리 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-4"
        >
          {/* 관리자 버튼 - 관리자일 경우에만 표시 */}
          {isAdmin && (
            <>
              <motion.button 
                onClick={() => router.push('/admin')}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-all group mb-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">관리자 페이지</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              
              <div className="h-px bg-gray-200 dark:bg-gray-800 my-2" />
            </>
          )}
          
          <motion.button 
            onClick={handleLogout}
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <span className="font-medium text-gray-700 dark:text-gray-300">로그아웃</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
          </motion.button>
          
          <div className="h-px bg-gray-200 dark:bg-gray-800 my-2" />
          
          <motion.button 
            onClick={() => setShowWithdrawModal(true)}
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                <UserX className="w-5 h-5 text-red-500" />
              </div>
              <span className="font-medium text-red-600 dark:text-red-400">회원탈퇴</span>
            </div>
            <ChevronRight className="w-5 h-5 text-red-400 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.section>
        </>
        )}
      </div>
      
      {/* 토스트 팝업 */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 left-0 right-0 flex justify-center z-50 pointer-events-none"
          >
            <div className="max-w-lg w-full px-5">
              <div className={`
                px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border pointer-events-auto
                ${toast.type === 'success' 
                  ? 'bg-green-500/90 dark:bg-green-600/90 text-white border-green-400/50' 
                  : 'bg-red-500/90 dark:bg-red-600/90 text-white border-red-400/50'
                }
              `}>
                <div className="flex items-center gap-3">
                  {toast.type === 'success' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                  <p className="font-medium">{toast.message}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 회원탈퇴 확인 모달 */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-2xl mx-auto mb-6">
                <UserX className="w-8 h-8 text-red-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
                정말 탈퇴하시겠습니까?
              </h2>
              
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 mb-8">
                <p className="text-center">
                  회원탈퇴 시 다음 정보가 모두 삭제됩니다:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>모든 예약 기록 및 이용 내역</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>회원 정보 및 포인트</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>기타 모든 개인 데이터</span>
                  </li>
                </ul>
                <p className="text-center text-red-500 font-medium mt-4">
                  삭제된 정보는 복구할 수 없습니다.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  disabled={isWithdrawing}
                  className="flex-1 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isWithdrawing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    '탈퇴하기'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}