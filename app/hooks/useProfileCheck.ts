'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

export function useProfileCheck() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // 이미 체크했거나 로딩 중인 경우 스킵
    if (hasChecked || status === 'loading') {
      return;
    }

    // 로그인하지 않은 경우 체크 완료로 처리
    if (status === 'unauthenticated' || !session?.user) {
      setHasChecked(true);
      return;
    }

    // 이미 회원가입 페이지에 있거나, 로그인/로그아웃 관련 페이지는 체크하지 않음
    const excludedPaths = ['/signup', '/login', '/api/auth', '/welcome'];
    if (excludedPaths.some(path => pathname.startsWith(path))) {
      setHasChecked(true);
      return;
    }

    // 프로필 확인
    const checkProfile = async () => {
      setIsCheckingProfile(true);
      try {
        const response = await fetch('/api/auth/profile');
        const data = await response.json();

        // 프로필이 없거나 불완전한 경우 회원가입 페이지로 리다이렉트
        if (!data.exists || data.incomplete) {
          router.push('/signup');
        }
      } catch (error) {
        console.error('프로필 확인 오류:', error);
      } finally {
        setIsCheckingProfile(false);
        setHasChecked(true);
      }
    };

    checkProfile();
  }, [session, status, router, pathname, hasChecked]);

  // 로딩 상태는 초기 세션 로딩 중이거나 프로필 체크 중일 때만
  const isLoading = status === 'loading' || (isCheckingProfile && !hasChecked);

  return { isCheckingProfile, isLoading };
}