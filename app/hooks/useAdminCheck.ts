'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export function useAdminCheck() {
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.email) {
      // API로 직접 관리자 권한 확인
      fetch('/api/auth/check-admin')
        .then(res => res.json())
        .then(data => {
          console.log('[useAdminCheck] API Response:', data);
          setIsAdmin(data.isAdmin || false);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('[useAdminCheck] Error:', error);
          setIsAdmin(false);
          setIsLoading(false);
        });
    } else {
      console.log('[useAdminCheck] No session');
      setIsAdmin(false);
      setIsLoading(false);
    }
  }, [session]);

  console.log('[useAdminCheck] Current state:', { isAdmin, isLoading, email: session?.user?.email });

  return { isAdmin, isLoading };
}