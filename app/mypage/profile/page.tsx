'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Loader2, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfileEditPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [nickname, setNickname] = useState('');
  const [originalNickname, setOriginalNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const nicknameTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 프로필 정보 불러오기
  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user?.email) return;
      
      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/profile');
        const data = await response.json();
        
        if (data.profile) {
          setNickname(data.profile.nickname || '');
          setOriginalNickname(data.profile.nickname || '');
        }
      } catch (error) {
        console.error('프로필 로드 오류:', error);
        setError('프로필 정보를 불러올 수 없습니다');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [session]);


  // 닉네임 검증
  const checkNickname = async (value: string) => {
    // 원래 닉네임과 같으면 검증 안함
    if (value === originalNickname) {
      setNicknameError(null);
      return;
    }

    if (!value || value.length < 2) {
      setNicknameError('닉네임은 2자 이상이어야 합니다');
      return;
    }
    
    if (value.length > 8) {
      setNicknameError('닉네임은 8자 이하여야 합니다');
      return;
    }

    setIsCheckingNickname(true);
    setNicknameError(null);

    try {
      const response = await fetch('/api/moderation/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: value,
          context: 'nickname'
        }),
      });

      const data = await response.json();

      if (!data.valid) {
        setNicknameError(data.reason || '사용할 수 없는 닉네임입니다');
      } else if (data.warning) {
        setNicknameError(data.warning);
      } else {
        setNicknameError(null);
      }
    } catch (error) {
      console.error('닉네임 검증 오류:', error);
    } finally {
      setIsCheckingNickname(false);
    }
  };

  // 닉네임 변경 핸들러
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);

    // 디바운스 적용
    if (nicknameTimerRef.current) {
      clearTimeout(nicknameTimerRef.current);
    }

    nicknameTimerRef.current = setTimeout(() => {
      if (value) {
        checkNickname(value);
      }
    }, 500);
  };

  const handleSave = async () => {
    // 변경사항이 없으면 리턴
    if (nickname === originalNickname) {
      router.push('/mypage');
      return;
    }

    if (nicknameError) {
      setError('올바른 닉네임을 입력해주세요');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '프로필 업데이트에 실패했습니다');
      }

      setSuccess('프로필이 성공적으로 업데이트되었습니다');
      setOriginalNickname(nickname);
      
      setTimeout(() => {
        router.push('/mypage');
      }, 1500);
    } catch (error: any) {
      setError(error.message || '프로필 업데이트에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const hasChanges = nickname !== originalNickname;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">프로필 수정</h1>
          <div className="w-9" /> {/* 균형을 위한 빈 공간 */}
        </div>
      </header>

      {/* 컨텐츠 */}
      <main className="pt-14 pb-20">
        <div className="max-w-2xl mx-auto p-4">
          {/* 알림 메시지 */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            {/* 이메일 (읽기 전용) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                이메일
              </label>
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400">
                {session?.user?.email}
              </div>
            </div>

            {/* 닉네임 */}
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                닉네임
              </label>
              <div className="relative">
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={handleNicknameChange}
                  className={`w-full px-4 py-3 border ${
                    nicknameError 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-200 dark:border-gray-700'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white dark:bg-gray-800 dark:text-white`}
                  placeholder="게임에서 사용할 닉네임 (2-8자)"
                  minLength={2}
                  maxLength={8}
                  required
                />
                {isCheckingNickname && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
                {!isCheckingNickname && nickname && nickname !== originalNickname && !nicknameError && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Check className="w-4 h-4 text-green-500" />
                  </div>
                )}
              </div>
              {nicknameError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {nicknameError}
                </p>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* 하단 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={() => router.back()}
            className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            disabled={isSaving}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges || !!nicknameError}
            className={`flex-1 px-4 py-3 rounded-lg transition-colors flex items-center justify-center ${
              hasChanges && !nicknameError
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              '저장'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}