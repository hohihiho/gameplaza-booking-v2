// 회원가입 페이지
// 비전공자 설명: 처음 로그인한 사용자가 추가 정보를 입력하는 페이지입니다
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { createClient } from '@/lib/supabase';
import { /* User, Phone, */ Loader2, Check, ArrowLeft, X } from 'lucide-react';
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

export default function SignupPage() {
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  
  // 약관 동의 상태
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [agreeAll, setAgreeAll] = useState(false);
  
  // 모달 상태
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
  // 약관 내용
  const [termsContent, setTermsContent] = useState('');
  const [privacyContent, setPrivacyContent] = useState('');
  
  const router = useRouter();
  const { data: session, status } = useSession();
  const supabase = createClient();
  const nicknameTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 세션 확인
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.push('/login');
      return;
    }
    
    // 이미 프로필이 있는지 확인
    const checkProfile = async () => {
      const response = await fetch('/api/auth/profile');
      const data = await response.json();
      
      if (data.exists && !data.incomplete) {
        router.push('/');
      }
    };
    
    checkProfile();
  }, [session, status, router, supabase]);

  // 약관 내용 불러오기
  useEffect(() => {
    const STORAGE_KEY = 'gameplaza_terms';
    const savedTerms = localStorage.getItem(STORAGE_KEY);
    
    if (savedTerms) {
      const terms = JSON.parse(savedTerms);
      
      // 활성화된 서비스 이용약관 찾기
      const activeTerms = terms.find((t: any) => 
        t.type === 'terms_of_service' && t.is_active
      );
      if (activeTerms) {
        setTermsContent(activeTerms.content);
      }
      
      // 활성화된 개인정보 처리방침 찾기
      const activePrivacy = terms.find((t: any) => 
        t.type === 'privacy_policy' && t.is_active
      );
      if (activePrivacy) {
        setPrivacyContent(activePrivacy.content);
      }
    }
  }, []);

  // 컴포넌트 언마운트 시 reCAPTCHA 정리 및 페이지 이탈 감지
  useEffect(() => {
    // 페이지 이탈 감지를 위한 이벤트 핸들러
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // 회원가입이 완료되지 않은 상태에서 페이지를 떠나려고 할 때
      if (session?.user && (!nickname || !isVerified)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    // 라우트 변경 감지
    const handleRouteChange = () => {
      // 회원가입이 완료되지 않은 상태에서 다른 페이지로 이동하려고 할 때
      if (session?.user && (!nickname || !isVerified)) {
        signOut({ redirect: false }).then(() => {
          router.push('/login');
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Next.js 라우터 이벤트 리스너 추가
    const originalPush = router.push;
    router.push = (...args: Parameters<typeof router.push>) => {
      handleRouteChange();
      return originalPush.apply(router, args);
    };

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      router.push = originalPush;
      
      if (clearRecaptcha) {
        clearRecaptcha();
      }
    };
  }, [session, nickname, isVerified, router]);


  const sendVerification = async () => {
    if (!sendVerificationCode) {
      setError('전화번호 인증 기능을 사용할 수 없습니다');
      return;
    }

    if (!phone || phone.length < 13) {
      setError('올바른 전화번호를 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 먼저 서버에서 SMS 발송 한도 체크
      const limitResponse = await fetch('/api/auth/phone/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      const limitData = await limitResponse.json();

      if (!limitResponse.ok) {
        throw new Error(limitData.error || 'SMS 발송 한도를 확인할 수 없습니다');
      }

      // Firebase로 SMS 발송
      const result = await sendVerificationCode(phone, 'recaptcha-container');

      if (!result.success) {
        throw new Error(result.error || '인증번호 발송에 실패했습니다');
      }

      setIsVerificationSent(true);
      setSuccess('인증번호가 발송되었습니다');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || '인증번호 발송에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!firebaseVerifyCode) {
      setError('전화번호 인증 기능을 사용할 수 없습니다');
      return;
    }

    if (!verificationCode || verificationCode.length < 6) {
      setError('6자리 인증번호를 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Firebase로 인증 코드 확인
      const result = await firebaseVerifyCode(verificationCode);

      if (!result.success) {
        throw new Error(result.error || '인증에 실패했습니다');
      }

      // 서버에 인증 확인
      const response = await fetch('/api/auth/phone/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          idToken: result.idToken,
          phone 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '인증에 실패했습니다');
      }

      setIsVerified(true);
      setSuccess('전화번호 인증이 완료되었습니다');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || '인증번호가 일치하지 않습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '');
    
    // 010-1234-5678 형식으로 포맷팅
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
  };


  // 닉네임 검증
  const checkNickname = async (value: string) => {
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

  // 전체 동의 처리
  const handleAgreeAll = (checked: boolean) => {
    setAgreeAll(checked);
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeAge(checked);
    setAgreeMarketing(checked);
  };

  // 개별 동의 변경 시 전체 동의 상태 업데이트
  useEffect(() => {
    const allRequired = agreeTerms && agreePrivacy && agreeAge;
    setAgreeAll(allRequired && agreeMarketing);
  }, [agreeTerms, agreePrivacy, agreeAge, agreeMarketing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname || !isVerified) {
      setError('모든 필드를 입력하고 전화번호 인증을 완료해주세요');
      return;
    }

    if (nicknameError) {
      setError('유효한 닉네임을 입력해주세요');
      return;
    }

    // 필수 약관 동의 확인
    if (!agreeTerms || !agreePrivacy || !agreeAge) {
      setError('필수 약관에 모두 동의해주세요');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // API를 통해 회원가입 처리
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname,
          phone,
          agreeMarketing
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '회원가입 실패');
      }

      // 성공하면 환영 페이지로 이동
      router.push('/welcome');
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || '회원가입 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-xl"
        >
          {/* 뒤로가기 버튼 */}
          <button
            onClick={() => {
              if (confirm('회원가입을 취소하시겠습니까? 입력한 정보는 저장되지 않습니다.')) {
                signOut({ callbackUrl: '/login' });
              }
            }}
            className="mb-6 inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">회원가입 취소</span>
          </button>
          
          <h1 className="text-2xl font-bold mb-2 dark:text-white">회원가입</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            게임플라자 이용을 위한 정보를 입력해주세요
          </p>

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
              </label>
              <div className="flex gap-2">
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white dark:bg-gray-800 dark:text-white"
                  placeholder="010-1234-5678"
                  maxLength={13}
                  disabled={isVerified}
                  required
                />
                {!isVerified && (
                  <button
                    type="button"
                    onClick={sendVerification}
                    disabled={isLoading || !phone || phone.length < 13}
                    className="px-4 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isVerificationSent ? '재발송' : '인증하기'}
                  </button>
                )}
                {isVerified && (
                  <div className="flex items-center px-4 text-green-600 dark:text-green-400">
                    <Check className="w-5 h-5" />
                  </div>
                )}
              </div>
            </div>

            {/* 인증번호 입력 */}
            {isVerificationSent && !isVerified && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.2 }}
              >
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  인증번호
                </label>
                <div className="flex gap-2">
                  <input
                    id="code"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white dark:bg-gray-800 dark:text-white"
                    placeholder="6자리 인증번호"
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={verifyCode}
                    disabled={!verificationCode || verificationCode.length < 6}
                    className="px-4 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    확인
                  </button>
                </div>
              </motion.div>
            )}

            {/* 약관 동의 */}
            <div className="space-y-4 border-t pt-6">
              <div className="space-y-3">
                {/* 전체 동의 */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeAll}
                    onChange={(e) => handleAgreeAll(e.target.checked)}
                    className="mt-1 w-4 h-4 text-gray-900 dark:text-white border-gray-300 rounded focus:ring-gray-900 dark:focus:ring-white"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    전체 약관에 동의합니다
                  </span>
                </label>

                <div className="ml-7 space-y-3">
                  {/* 이용약관 */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-1 w-4 h-4 text-gray-900 dark:text-white border-gray-300 rounded focus:ring-gray-900 dark:focus:ring-white"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-red-500">*</span> 서비스 이용약관 동의
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                      >
                        보기
                      </button>
                    </span>
                  </label>

                  {/* 개인정보 처리방침 */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreePrivacy}
                      onChange={(e) => setAgreePrivacy(e.target.checked)}
                      className="mt-1 w-4 h-4 text-gray-900 dark:text-white border-gray-300 rounded focus:ring-gray-900 dark:focus:ring-white"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-red-500">*</span> 개인정보 수집 및 이용 동의
                      <button
                        type="button"
                        onClick={() => setShowPrivacyModal(true)}
                        className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                      >
                        보기
                      </button>
                    </span>
                  </label>

                  {/* 만 14세 이상 */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeAge}
                      onChange={(e) => setAgreeAge(e.target.checked)}
                      className="mt-1 w-4 h-4 text-gray-900 dark:text-white border-gray-300 rounded focus:ring-gray-900 dark:focus:ring-white"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-red-500">*</span> 만 14세 이상입니다
                    </span>
                  </label>

                  {/* 마케팅 수신 동의 */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeMarketing}
                      onChange={(e) => setAgreeMarketing(e.target.checked)}
                      className="mt-1 w-4 h-4 text-gray-900 dark:text-white border-gray-300 rounded focus:ring-gray-900 dark:focus:ring-white"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-gray-400">(선택)</span> 이벤트 및 혜택 정보 수신 동의
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* 에러 및 성공 메시지 */}
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg">
                {success}
              </div>
            )}

            {/* 가입 버튼 */}
            <button
              type="submit"
              disabled={isLoading || !nickname || !isVerified || !!nicknameError || isCheckingNickname || !agreeTerms || !agreePrivacy || !agreeAge}
              className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  처리 중...
                </>
              ) : (
                '가입하기'
              )}
            </button>
          </form>

          {/* Firebase reCAPTCHA 컨테이너 */}
          <div id="recaptcha-container"></div>
        </motion.div>
      </div>
      
      {/* 이용약관 모달 */}
      <AnimatePresence>
        {showTermsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowTermsModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl max-h-[80vh] bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden flex flex-col"
            >
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">서비스 이용약관</h2>
                  <button
                    onClick={() => setShowTermsModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-sans">
                  {termsContent || '약관 내용을 불러오는 중...'}
                </pre>
              </div>
              
              <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-6">
                <button
                  onClick={() => {
                    setAgreeTerms(true);
                    setShowTermsModal(false);
                  }}
                  className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  동의하고 닫기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 개인정보 처리방침 모달 */}
      <AnimatePresence>
        {showPrivacyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowPrivacyModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl max-h-[80vh] bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden flex flex-col"
            >
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">개인정보 처리방침</h2>
                  <button
                    onClick={() => setShowPrivacyModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-sans">
                  {privacyContent || '개인정보 처리방침을 불러오는 중...'}
                </pre>
              </div>
              
              <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-6">
                <button
                  onClick={() => {
                    setAgreePrivacy(true);
                    setShowPrivacyModal(false);
                  }}
                  className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  동의하고 닫기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}