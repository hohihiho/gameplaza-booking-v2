'use client';

import { createContext, useContext } from 'react';
import { useAuth, signOut as betterAuthSignOut } from '@/lib/auth/client';

// Re-export for compatibility
export const useSession = useAuth;
export const signOut = betterAuthSignOut;

// For components that need the session context
const SessionContext = createContext<any>(null);

export function BetterAuthProvider({ children }: { children: React.ReactNode }) {
  const session = useAuth();
  
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

export default BetterAuthProvider;