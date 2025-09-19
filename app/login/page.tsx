// 로그인 페이지
// 비전공자 설명: 사용자가 구글 계정으로 로그인하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/components/providers/AuthProvider';
import { authClient } from '@/lib/auth/cloudflare-client';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Sparkles, Trophy, Users, Calendar, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { LoadingButton } from '@/app/components/mobile';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();

  // URL 파라미터로 전달된 에러 메시지 처리
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      if (errorParam === 'AccessDenied') {
        setError('액세스가 거부되었습니다. Google Cloud Console에서 OAuth 설정을 확인해주세요.');
      } else if (errorParam === 'Configuration') {
        setError('OAuth 설정에 문제가 있습니다. 관리자에게 문의해주세요.');
      } else {
        setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  }, [searchParams]);

  // 로그인 상태 확인 - 리다이렉트 제거
  // useEffect(() => {
  //   if (!isPending && session?.user) {
  //     router.push('/');
  //   }
  // }, [session, isPending, router]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Better Auth를 통한 Google 로그인
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/'
      });
      
    } catch (error) {
      console.error('Login error:', error);
      setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      setIsLoading(false);
    }
  };

  // 로딩 중
  if (isPending) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">로딩 중...</p>
        </div>
      </main>
    );
  }

  // 이미 로그인한 경우 - 로그아웃 버튼 표시
  if (session?.user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 p-4">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              이미 로그인되어 있습니다
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                {session.user.image && (
                  <Image 
                    src={session.user.image}
                    alt="Profile"
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {session.user.name || session.user.email}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {session.user.email}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/')}
                  className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  홈으로 이동
                </button>
                
                <button
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      await authClient.signOut();
                      router.push('/login');
                    } catch (error) {
                      console.error('로그아웃 실패:', error);
                    }
                    setIsLoading(false);
                  }}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '로그아웃 중...' : '로그아웃'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen">
      {/* 홈으로 가는 버튼 */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-4 left-4 z-20 p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
        aria-label="홈으로 이동"
      >
        <svg 
          className="w-6 h-6 text-gray-700 dark:text-gray-300" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 19l-7-7 7-7" 
          />
        </svg>
      </button>

      {/* 배경 그라데이션 - 스플래시와 동일 */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-indigo-100 to-purple-200 dark:from-purple-950 dark:via-indigo-900 dark:to-purple-900">
        <div className="absolute inset-0 bg-gradient-mesh opacity-20" />
      </div>

      {/* 배경 장식 요소 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
      </div>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 flex min-h-screen">
        {/* 왼쪽: 로그인 폼 */}
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* 로고와 타이틀 */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="w-24 h-24 bg-white/30 dark:bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl relative overflow-hidden border border-white/40 dark:border-white/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-indigo-500/20" />
                {/* 스플래시와 동일한 이미지 사용 - 패딩 제거 */}
                <div className="relative w-24 h-24">
                  <Image
                    src="/light.png"
                    alt="Gameplaza logo"
                    fill
                    sizes="96px"
                    priority
                    className="object-contain drop-shadow-lg dark:hidden"
                  />
                  <Image
                    src="/dark.png"
                    alt="Gameplaza logo"
                    fill
                    sizes="96px"
                    priority
                    className="hidden object-contain drop-shadow-lg dark:block"
                  />
                </div>
              </motion.div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">게임플라자</h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">리듬게임의 성지, 광주 게임플라자</p>
            </div>

            {/* 로그인 폼 카드 */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-purple-500/30 p-8 overflow-visible dark:shadow-purple-900/20"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">환영합니다!</h2>
              
              <div className="space-y-4">
                <LoadingButton
                  onClick={handleGoogleLogin}
                  isLoading={isLoading}
                  variant="secondary"
                  size="lg"
                  fullWidth
                  className="shadow-md min-h-[48px] touch-target"
                  haptic="medium"
                  aria-label="Google 계정으로 로그인하기"
                  role="button"
                  icon={
                    <svg className="w-5 h-5" viewBox="0 0 24 24" role="img" aria-label="Google 로고">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  }
                  loadingText="로그인 중..."
                >
                  Google로 계속하기
                </LoadingButton>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl text-center animate-shake"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white/90 dark:bg-gray-800/90 text-gray-500">또는</span>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    처음 방문하셨나요?
                    <br />
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      로그인 후 간단한 회원가입이 진행됩니다
                    </span>
                  </p>
                </div>

              </div>
            </motion.div>

            {/* 문의 정보 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center mt-6"
            >
              <a 
                href="https://open.kakao.com/o/sJPbo3Sb"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.48 3 2 6.69 2 11.24c0 2.97 1.89 5.56 4.71 7.01-.1.48-.63 3.05-.65 3.19-.03.21.11.21.23.12.1-.07 3.59-2.42 4.13-2.78.53.08 1.07.12 1.62.12 5.52 0 10-3.69 10-8.24C22 6.69 17.52 3 12 3z"/>
                </svg>
                카카오톡 1:1 문의
              </a>
            </motion.div>
          </motion.div>
        </div>

        {/* 오른쪽: 특징 소개 (데스크톱만) */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-8 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 dark:from-gray-800 dark:via-gray-900 dark:to-black">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-lg"
          >
            <h2 className="text-3xl font-bold text-white mb-8">
              광주 최고의 리듬게임 성지
              <Sparkles className="inline w-8 h-8 ml-2 text-yellow-300" />
            </h2>
            
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex items-start gap-4"
              >
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">최신 기기 보유</h3>
                  <p className="text-indigo-100">사운드볼텍스, 마이마이, 츄니즘 등<br />다양한 최신 리듬게임 보유 및 업데이트</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex items-start gap-4"
              >
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-cyan-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">편리한 예약 시스템</h3>
                  <p className="text-indigo-100">원하는 시간에 기기를 미리 예약하세요</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="flex items-start gap-4"
              >
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-green-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">활발한 커뮤니티</h3>
                  <p className="text-indigo-100">함께 즐기는 리듬게임 문화</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="flex items-start gap-4"
              >
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">최상의 기체 상태</h3>
                  <p className="text-indigo-100">정기적인 점검과 보수로 최고의 컨디션 유지</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
