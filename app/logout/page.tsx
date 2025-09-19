'use client';

import { useEffect } from 'react';
import { authClient } from '@/lib/auth/cloudflare-client';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        console.log('🔄 로그아웃 시작...');
        
        // Better Auth 로그아웃
        await authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              console.log('✅ 로그아웃 성공');
              // 로그인 페이지로 리다이렉트
              router.push('/login');
            },
            onError: (error) => {
              console.error('❌ 로그아웃 실패:', error);
              // 실패해도 로그인 페이지로 이동
              router.push('/login');
            }
          }
        });
      } catch (error) {
        console.error('❌ 로그아웃 에러:', error);
        // 에러가 발생해도 로그인 페이지로 이동
        router.push('/login');
      }
    };

    performLogout();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">로그아웃 중...</p>
      </div>
    </div>
  );
}