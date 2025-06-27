// 로그인 페이지
// 비전공자 설명: 사용자가 구글 계정으로 로그인하는 페이지입니다
'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Gamepad2, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  // 이미 로그인한 사용자는 콜백 페이지로 리다이렉트하여 프로필 확인
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/auth/callback');
    }
  }, [status, router]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // NextAuth를 통한 Google 로그인
      const result = await signIn('google', { 
        callbackUrl: '/',
        redirect: false 
      });
      
      if (result?.url) {
        // 로그인 성공 시 페이지 새로고침과 함께 리다이렉트
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      setIsLoading(false);
    }
  };
  // 로딩 중이거나 이미 로그인한 경우
  if (status === 'loading' || status === 'authenticated') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-gray-600 dark:text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">
            {status === 'authenticated' ? '리다이렉트 중...' : '로딩 중...'}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md space-y-12">
        {/* 로고와 타이틀 */}
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-900 dark:bg-white rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Gamepad2 className="w-10 h-10 text-white dark:text-gray-900" />
          </div>
          <h1 className="text-3xl font-bold dark:text-white">게임플라자</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">로그인하여 게임기를 예약하세요</p>
        </div>

        {/* 로그인 폼 */}
        <div className="space-y-4">
          <button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            )}
            <span className="font-medium text-gray-900 dark:text-white">
              {isLoading ? '로그인 중...' : 'Google로 로그인'}
            </span>
          </button>

          {error && (
            <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
              {error}
            </div>
          )}

          <p className="text-xs text-center text-gray-500 dark:text-gray-400 px-8">
            로그인 시 서비스 이용약관에 동의하는 것으로 간주됩니다
          </p>
        </div>

        {/* 추가 안내 */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            처음 방문하셨나요? 로그인 후 회원가입이 진행됩니다
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            문의: 062-123-4567
          </p>
        </div>
      </div>
    </main>
  );
}