'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

// 회원가입 체크가 필요없는 경로들
const excludedPaths = [
  '/login',
  '/signup',
  '/auth',
  '/api',
  '/admin', // 관리자 페이지는 별도 체크
];

export function AuthCheck() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkUserProfile = async () => {
      // 로딩 중이거나 로그인하지 않은 경우 스킵
      if (status === 'loading' || !session?.user?.email) return;
      
      // 제외된 경로는 체크하지 않음
      if (excludedPaths.some(path => pathname.startsWith(path))) return;

      try {
        // API를 통해 프로필 확인
        const response = await fetch('/api/auth/profile');
        
        // 응답이 JSON이 아닐 수 있으므로 안전하게 처리
        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          return;
        }

        if (!response.ok || !data?.exists || data?.incomplete) {
          // 프로필이 없거나 불완전하면 회원가입 페이지로
          router.push('/signup');
        }
      } catch (err) {
      }
    };

    checkUserProfile();
  }, [session, status, pathname, router]);

  return null; // UI 렌더링 없음
}