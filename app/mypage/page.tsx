// 마이페이지
// 비전공자 설명: 사용자의 개인정보와 설정을 관리하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User, Bell, LogOut, UserX, ChevronRight, Edit2 } from 'lucide-react';

export default function MyPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState({
    reservation: true,
    event: true,
  });

  useEffect(() => {
    // 프로필 정보 불러오기
    const loadProfile = async () => {
      if (!session?.user?.email) return;
      
      try {
        const response = await fetch('/api/auth/profile');
        const data = await response.json();
        
        if (data.profile) {
          setUserProfile(data.profile);
        }
      } catch (error) {
        console.error('프로필 로드 오류:', error);
      }
    };

    loadProfile();
  }, [session]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-lg mx-auto px-5 py-6">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold dark:text-white">마이페이지</h1>
        </div>

        {/* 프로필 섹션 */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-6 dark:text-white">프로필 정보</h2>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || '프로필'}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-lg dark:text-white">
                {userProfile?.nickname || session?.user?.name || '사용자'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{session?.user?.email || ''}</p>
            </div>
            <button
              onClick={() => router.push('/mypage/profile')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Edit2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          
          {/* 프로필 정보 표시 */}
          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">닉네임</span>
              <span className="text-sm font-medium dark:text-white">
                {userProfile?.nickname || '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">전화번호</span>
              <span className="text-sm font-medium dark:text-white">
                {userProfile?.phone ? 
                  `${userProfile.phone.slice(0, 3)}-${userProfile.phone.slice(3, 7)}-${userProfile.phone.slice(7)}` 
                  : '-'
                }
              </span>
            </div>
          </div>
          
          <button 
            onClick={() => router.push('/mypage/profile')}
            className="w-full mt-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            프로필 수정
          </button>
        </section>

        {/* 예약 통계 */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">예약 현황</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold dark:text-white">12</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">전체 예약</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">10</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">완료</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">1</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">예정</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">1</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">취소</p>
            </div>
          </div>
        </section>

        {/* 알림 설정 */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5" />
            알림 설정
          </h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700 dark:text-gray-300">예약 알림</span>
              <button
                onClick={() => setNotifications({ ...notifications, reservation: !notifications.reservation })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notifications.reservation ? 'bg-gray-900 dark:bg-white' : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white dark:bg-gray-900 rounded-full transition-transform ${
                  notifications.reservation ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </label>
            
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700 dark:text-gray-300">이벤트 알림</span>
              <button
                onClick={() => setNotifications({ ...notifications, event: !notifications.event })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notifications.event ? 'bg-gray-900 dark:bg-white' : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white dark:bg-gray-900 rounded-full transition-transform ${
                  notifications.event ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </label>
          </div>
        </section>

        {/* 계정 관리 */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl p-6">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">로그아웃</span>
            </div>
            <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
          </button>
          
          <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors group">
            <div className="flex items-center gap-3">
              <UserX className="w-5 h-5 text-red-500" />
              <span className="text-red-600 dark:text-red-400">회원탈퇴</span>
            </div>
            <span className="text-red-400 group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </section>
      </div>
    </main>
  );
}