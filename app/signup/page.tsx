// 회원가입 페이지
// 비전공자 설명: 처음 로그인한 사용자가 추가 정보를 입력하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createClient } from '@/lib/supabase/client';
import { User, Phone, Loader2, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SignupPage() {
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { data: session, status } = useSession();
  const supabase = createClient();

  useEffect(() => {
    // 세션 확인
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.push('/login');
      return;
    }
    
    // 이미 프로필이 있는지 확인
    const checkProfile = async () => {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email!)
        .single();
      
      if (profile) {
        router.push('/');
      }
    };
    
    checkProfile();
  }, [session, status, router, supabase]);

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

  const sendVerification = async () => {
    if (!phone || phone.length < 13) {
      setError('올바른 전화번호를 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 실제로는 SMS API를 연동해야 합니다
      // 지금은 테스트를 위해 고정된 코드 사용
      console.log('인증번호 발송:', phone);
      setIsVerificationSent(true);
      setError('테스트: 인증번호는 "123456" 입니다');
    } catch (error) {
      setError('인증번호 발송에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = () => {
    // 실제로는 서버에서 확인해야 합니다
    if (verificationCode === '123456') {
      setIsVerified(true);
      setError(null);
    } else {
      setError('인증번호가 일치하지 않습니다');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname || !isVerified) {
      setError('모든 필드를 입력하고 전화번호 인증을 완료해주세요');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // users 테이블에 프로필 생성
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: session!.user.id,
          email: session!.user.email!,
          nickname,
          phone: phone.replace(/-/g, ''), // 하이픈 제거하여 저장
          is_admin: false,
          is_active: true
        });

      if (profileError) throw profileError;

      // 성공하면 홈으로 이동
      router.push('/');
    } catch (error: any) {
      console.error('Signup error:', error);
      setError('회원가입 중 오류가 발생했습니다');
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
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-5">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800"
        >
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
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white dark:bg-gray-800 dark:text-white"
                placeholder="게임에서 사용할 닉네임"
                required
              />
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

            {/* 에러 메시지 */}
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
                {error}
              </div>
            )}

            {/* 가입 버튼 */}
            <button
              type="submit"
              disabled={isLoading || !nickname || !isVerified}
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
        </motion.div>
      </div>
    </main>
  );
}