'use client';

import { useSession } from "@/lib/auth-compat";

export function useIsAdmin() {
  const { data: session, status } = useSession();
  
  // status가 loading인 경우에만 loading을 true로 설정
  const loading = status === 'loading';
  
  // 세션에서 직접 isAdmin 값을 가져옴
  const isAdmin = session?.user?.isAdmin || false;

  return { isAdmin, loading };
}