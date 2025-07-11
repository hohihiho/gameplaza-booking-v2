'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Loader2, Check, AlertCircle, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// Firebase imports with error handling
let sendVerificationCode: any;
let firebaseVerifyCode: any; 
let clearRecaptcha: any;

try {
  const firebaseModule = require('@/lib/firebase/client');
  sendVerificationCode = firebaseModule.sendVerificationCode;
  firebaseVerifyCode = firebaseModule.verifyCode;
  clearRecaptcha = firebaseModule.clearRecaptcha;
} catch (error) {
  console.warn('Firebase module not available');
}

export default function ProfileEditPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [originalNickname, setOriginalNickname] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const nicknameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [canChangePhone, setCanChangePhone] = useState(true);
  const [nextPhoneChangeDate, setNextPhoneChangeDate] = useState<string | null>(null);
  const [showPhoneWarning, setShowPhoneWarning] = useState(false);
  
  // 전화번호 재인증 관련 state
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

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
          setPhone(formatPhoneNumber(data.profile.phone || ''));
          setOriginalPhone(formatPhoneNumber(data.profile.phone || ''));
          
          // 전화번호 변경 가능 여부 확인
          if (data.profile.phone_changed_at) {
            const lastChanged = new Date(data.profile.phone_changed_at);
            const nextChangeDate = new Date(lastChanged);
            nextChangeDate.setMonth(nextChangeDate.getMonth() + 1);
            
            if (nextChangeDate > new Date()) {
              setCanChangePhone(false);
              setNextPhoneChangeDate(nextChangeDate.toLocaleDateString('ko-KR'));
            }
          }
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
  
  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (clearRecaptcha) {
        clearRecaptcha();
      }
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, []);

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
    
    // 전화번호가 변경되었고, 변경이 불가능한 경우 경고 표시
    if (formatted !== originalPhone && !canChangePhone) {
      setShowPhoneWarning(true);
    } else {
      setShowPhoneWarning(false);
    }
  };

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
  // 전화번호 인증 코드 발송
  const sendPhoneVerificationCode = async () => {
    if (!sendVerificationCode || !phone) return;
    
    setIsSendingCode(true);
    setVerificationError(null);
    
    try {
      const phoneWithoutHyphen = phone.replace(/-/g, '');
      // 한국 전화번호를 국제 형식으로 변환
      const formattedPhone = phoneWithoutHyphen.startsWith('010') 
        ? `+82${phoneWithoutHyphen.substring(1)}` 
        : phoneWithoutHyphen;
      
      // Firebase로 인증 코드 발송
      const response = await fetch('/api/auth/phone/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsCodeSent(true);
        setCountdown(180); // 3분
        
        // 카운트다운 시작
        countdownRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              if (countdownRef.current) {
                clearInterval(countdownRef.current);
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setVerificationError(data.error || '인증 코드 발송에 실패했습니다');
      }
    } catch (error) {
      console.error('인증 코드 발송 오류:', error);
      setVerificationError('인증 코드 발송 중 오류가 발생했습니다');
    } finally {
      setIsSendingCode(false);
    }
  };
  
  // 전화번호 인증 코드 확인
  const verifyPhoneCode = async () => {
    if (!firebaseVerifyCode || !verificationCode) return;
    
    setIsVerifying(true);
    setVerificationError(null);
    
    try {
      const phoneWithoutHyphen = phone.replace(/-/g, '');
      // 한국 전화번호를 국제 형식으로 변환
      const formattedPhone = phoneWithoutHyphen.startsWith('010') 
        ? `+82${phoneWithoutHyphen.substring(1)}` 
        : phoneWithoutHyphen;
      
      const response = await fetch('/api/auth/phone/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: formattedPhone,
          code: verificationCode 
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // 인증 성공 - 프로필 업데이트 진행
        setShowPhoneVerification(false);
        setIsCodeSent(false);
        setVerificationCode('');
        
        // 프로필 업데이트 진행
        await updateProfile();
      } else {
        setVerificationError(data.error || '인증에 실패했습니다');
      }
    } catch (error) {
      console.error('인증 코드 확인 오류:', error);
      setVerificationError('인증 확인 중 오류가 발생했습니다');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);
    
    // 기존 타이머 클리어
    if (nicknameTimerRef.current) {
      clearTimeout(nicknameTimerRef.current);
    }
    
    // 디바운스를 위한 타이머
    nicknameTimerRef.current = setTimeout(() => {
      if (value) {
        checkNickname(value);
      } else {
        setNicknameError(null);
      }
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 변경사항이 없으면 리턴
    if (nickname === originalNickname && phone === originalPhone) {
      setError('변경사항이 없습니다');
      return;
    }

    if (!nickname || !phone) {
      setError('모든 필드를 입력해주세요');
      return;
    }

    if (nicknameError) {
      setError('유효한 닉네임을 입력해주세요');
      return;
    }
    
    // 전화번호 변경 제한 확인
    if (phone !== originalPhone && !canChangePhone) {
      setError(`전화번호는 한 달에 한 번만 변경할 수 있습니다. 다음 변경 가능일: ${nextPhoneChangeDate}`);
      return;
    }
    
    // 전화번호가 변경된 경우 재인증 요구
    if (phone !== originalPhone) {
      setShowPhoneVerification(true);
      return;
    }
    
    // 닉네임만 변경된 경우 바로 업데이트
    await updateProfile();
  };
  
  // 프로필 업데이트 함수
  const updateProfile = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/mypage/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname,
          phone: phone.replace(/-/g, '')
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '프로필 수정 실패');
      }

      setSuccess('프로필이 수정되었습니다');
      setOriginalNickname(nickname);
      setOriginalPhone(phone);
      
      setTimeout(() => {
        router.push('/mypage');
      }, 1500);
    } catch (error: any) {
      console.error('프로필 수정 오류:', error);
      setError(error.message || '프로필 수정 중 오류가 발생했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-lg mx-auto px-5 py-6">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 dark:text-white" />
          </button>
          <h1 className="text-xl font-bold dark:text-white">프로필 수정</h1>
        </div>

        {/* 수정 폼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* 전화번호 */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                전화번호
                {!canChangePhone && (
                  <span className="ml-2 text-xs text-red-500">
                    (변경 불가 - {nextPhoneChangeDate}부터 가능)
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  className={`w-full px-4 py-3 border ${
                    showPhoneWarning
                      ? 'border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white dark:bg-gray-800 dark:text-white`}
                  placeholder="010-1234-5678"
                  maxLength={13}
                  required
                  disabled={phone !== originalPhone && !canChangePhone}
                />
                {!canChangePhone && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                )}
              </div>
              <div className="mt-1 space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  • 전화번호는 한 달에 한 번만 변경 가능합니다
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  • 변경 시 재인증이 필요합니다
                </p>
                {showPhoneWarning && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    ⚠️ 전화번호를 변경할 수 없습니다. {nextPhoneChangeDate}부터 변경 가능합니다.
                  </p>
                )}
              </div>
            </div>

            {/* 에러 및 성공 메시지 */}
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center gap-2">
                <Check className="w-4 h-4" />
                {success}
              </div>
            )}

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSaving || !!nicknameError || isCheckingNickname || (nickname === originalNickname && phone === originalPhone)}
                className="flex-1 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  '저장하기'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
      
      {/* 전화번호 인증 모달 */}
      <AnimatePresence>
        {showPhoneVerification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div 
              className="absolute inset-0 bg-black/50"
              onClick={() => {
                setShowPhoneVerification(false);
                setIsCodeSent(false);
                setVerificationCode('');
                setVerificationError(null);
              }}
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6"
            >
              <h3 className="text-xl font-bold mb-4 dark:text-white">
                전화번호 재인증
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                전화번호 변경을 위해 새 번호로 인증이 필요합니다.
              </p>
              
              <div className="space-y-4">
                {/* 전화번호 표시 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    새 전화번호
                  </label>
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white font-medium">
                    {phone}
                  </div>
                </div>
                
                {/* 인증 코드 입력 */}
                {isCodeSent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      인증 코드
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white dark:bg-gray-800 dark:text-white"
                      placeholder="6자리 숫자 입력"
                      maxLength={6}
                    />
                    {countdown > 0 && (
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        남은 시간: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                      </p>
                    )}
                  </div>
                )}
                
                {/* 에러 메시지 */}
                {verificationError && (
                  <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {verificationError}
                  </div>
                )}
                
                {/* 버튼들 */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPhoneVerification(false);
                      setIsCodeSent(false);
                      setVerificationCode('');
                      setVerificationError(null);
                    }}
                    className="flex-1 py-3 border border-gray-300 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    취소
                  </button>
                  
                  {!isCodeSent ? (
                    <button
                      type="button"
                      onClick={sendPhoneVerificationCode}
                      disabled={isSendingCode}
                      className="flex-1 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSendingCode ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          발송 중...
                        </>
                      ) : (
                        <>
                          <Phone className="w-5 h-5" />
                          인증 코드 발송
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={verifyPhoneCode}
                      disabled={isVerifying || verificationCode.length !== 6}
                      className="flex-1 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          확인 중...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          인증 확인
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              {/* reCAPTCHA 컨테이너 */}
              <div id="recaptcha-container"></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}