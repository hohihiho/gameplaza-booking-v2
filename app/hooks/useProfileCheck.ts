'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

export function useProfileCheck() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    
    // 로딩 중이거나 로그인하지 않은 경우 체크하지 않음
    if (status === 'loading' || !session?.user) {
      return;
    }

    // 이미 회원가입 페이지에 있거나, 로그인/로그아웃 관련 페이지는 체크하지 않음
    const excludedPaths = ['/signup', '/login', '/api/auth', '/welcome'];
    if (excludedPaths.some(path => pathname.startsWith(path))) {
      return;
    }

    // 프로필 확인
    const checkProfile = async () => {
      try {
        const response = await fetch('/api/auth/profile');
        const data = await response.json();

        // 프로필이 없거나 불완전한 경우 회원가입 페이지로 리다이렉트
        if (!data.exists || data.incomplete) {
          router.push('/signup');
        } else {
        }
      } catch (error) {
        console.error('프로필 확인 오류:', error);
      }
    };

    checkProfile();
  }, [session, status, router, pathname]);
}