'use client';

import { useSession } from "@/lib/auth-compat";
import { useEffect, useState, useRef } from 'react';

// 관리자 권한 캐시 - 메모리에 저장하여 불필요한 API 호출 방지
const adminCache = new Map<string, { isAdmin: boolean; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5분 캐시

// 진행 중인 요청을 추적하여 중복 호출 방지
const pendingRequests = new Map<string, Promise<any>>();

export function useAdminCheck() {
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const lastEmailRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const currentEmail = session?.user?.email;
    
    console.log('[useAdminCheck] useEffect 실행:', { 
      currentEmail, 
      lastEmail: lastEmailRef.current, 
      isLoading,
      hasCache: currentEmail ? adminCache.has(currentEmail) : false
    });
    
    // 이메일이 변경되지 않았다면 API 호출하지 않음
    if (currentEmail === lastEmailRef.current) {
      console.log('[useAdminCheck] 이메일 변경 없음, API 호출 건너뜀');
      return;
    }
    
    lastEmailRef.current = currentEmail || null;
    
    if (currentEmail) {
      // 캐시 확인
      const cached = adminCache.get(currentEmail);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp < CACHE_DURATION)) {
        // 캐시된 데이터 사용
        if (isMounted) {
          console.log('[useAdminCheck] Using cached data:', cached);
          setIsAdmin(cached.isAdmin);
          setIsLoading(false);
        }
        return;
      }

      // 진행 중인 요청이 있는지 확인
      const existingRequest = pendingRequests.get(currentEmail);
      if (existingRequest) {
        console.log('[useAdminCheck] 이미 진행 중인 요청 있음, 기다림:', currentEmail);
        existingRequest
          .then(data => {
            if (isMounted) {
              setIsAdmin(data.isAdmin || false);
              setIsLoading(false);
            }
          })
          .catch(() => {
            if (isMounted) {
              setIsAdmin(false);
              setIsLoading(false);
            }
          });
        return;
      }

      // API로 관리자 권한 확인 (캐시 없거나 만료된 경우만)
      console.log('[useAdminCheck] Fetching admin status for:', currentEmail);
      setIsLoading(true);
      
      const requestPromise = fetch('/api/auth/check-admin')
        .then(res => res.json())
        .then(data => {
          const isAdminResult = data.isAdmin || false;
          console.log('[useAdminCheck] API Response:', data);
          
          // 캐시에 저장
          adminCache.set(currentEmail, {
            isAdmin: isAdminResult,
            timestamp: now
          });
          
          // 진행 중인 요청에서 제거
          pendingRequests.delete(currentEmail);
          
          return data;
        })
        .catch((error) => {
          console.error('[useAdminCheck] Error:', error);
          // 진행 중인 요청에서 제거
          pendingRequests.delete(currentEmail);
          throw error;
        });
      
      // 진행 중인 요청으로 등록
      pendingRequests.set(currentEmail, requestPromise);
      
      requestPromise
        .then(data => {
          if (isMounted) {
            setIsAdmin(data.isAdmin || false);
            setIsLoading(false);
          }
        })
        .catch((error) => {
          if (isMounted) {
            setIsAdmin(false);
            setIsLoading(false);
          }
        });
    } else {
      // 세션이 없는 경우
      console.log('[useAdminCheck] No session');
      setIsAdmin(false);
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [session?.user?.email]); // isLoading 의존성 제거

  return { isAdmin, isLoading };
}