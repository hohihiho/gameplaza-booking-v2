'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from '@/components/providers/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';

export function useProfileCheck() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const hasCheckedRef = useRef(false); // 중복 체크 방지용 ref

  useEffect(() => {
    // Better Auth 세션이 로딩 중인 경우 대기
    if (isPending) {
      return;
    }

    // 로그인하지 않은 경우 프로필 체크 불필요
    if (!session?.user) {
      setIsCheckingProfile(false);
      hasCheckedRef.current = false; // 로그아웃 시 리셋
      return;
    }

    // 프로필 체크 제외 경로들
    const excludedPaths = ['/signup', '/login', '/api/auth', '/welcome', '/privacy', '/terms'];
    if (excludedPaths.some(path => pathname.startsWith(path))) {
      setIsCheckingProfile(false);
      return;
    }

    // 이미 체크했다면 재체크하지 않음
    if (hasCheckedRef.current) {
      return;
    }

    // 로그인한 사용자의 프로필 완성도 확인
    const checkProfile = async () => {
      setIsCheckingProfile(true);
      hasCheckedRef.current = true; // 체크 시작 표시
      
      try {
        console.log('🔍 프로필 완성도 체크 시작:', session.user.email);
        
        const response = await fetch('/api/auth/profile', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('📋 프로필 체크 결과:', data);

          // 프로필이 불완전한 경우 회원가입 페이지로 리다이렉트
          if (data.incomplete) {
            console.log('🔄 불완전한 프로필 - 회원가입 페이지로 이동');
            router.push('/signup');
            return;
          }

          console.log('✅ 프로필 완성됨');
        } else if (response.status === 401) {
          // 401 에러는 세션이 없는 경우이므로 무시
          console.log('⚠️ 세션 없음 - 프로필 체크 건너뛰기');
          hasCheckedRef.current = false; // 다음에 다시 체크할 수 있도록
        } else {
          console.error('❌ 프로필 체크 API 오류:', response.status);
        }
      } catch (error) {
        console.error('❌ 프로필 확인 중 오류:', error);
        // 네트워크 오류 등의 경우 사용자 경험을 위해 그냥 진행
      } finally {
        setIsCheckingProfile(false);
      }
    };

    // 프로필 체크 실행 (디바운스 적용)
    const timeoutId = setTimeout(checkProfile, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [session, isPending, router, pathname]); // isCheckingProfile 의존성 제거

  return { 
    isCheckingProfile, 
    isLoading: isPending 
  };
}