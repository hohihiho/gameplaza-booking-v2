'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function useIsAdmin() {
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.email) {
      console.log('useIsAdmin: No session email');
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    // API를 통해 관리자 권한 확인
    const checkAdmin = async () => {
      try {
        console.log('useIsAdmin: Checking admin status for', session.user.email);
        const response = await fetch('/api/auth/profile');
        const data = await response.json();
        
        console.log('useIsAdmin: Profile API response', data);
        
        if (data.isAdmin === true) {
          console.log('useIsAdmin: User is admin!');
          setIsAdmin(true);
        } else {
          console.log('useIsAdmin: User is not admin');
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('useIsAdmin: Admin check error:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [session?.user?.email]);

  console.log('useIsAdmin: Returning', { isAdmin, loading });
  return { isAdmin, loading };
}