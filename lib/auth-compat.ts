'use client';

import { createAuthClient } from "better-auth/react";
import { useState, useEffect } from "react";

// Better Auth client setup
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
});

// Compatibility types to match next-auth/react
export interface Session {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
  expires: string;
}

export interface UseSessionResult {
  data: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
}

// Compatibility hook that mimics next-auth/react useSession
export function useSession(): UseSessionResult {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      try {
        const { data } = await authClient.getSession();
        
        if (!mounted) return;
        
        if (data?.session && data?.user) {
          setSession({
            user: {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              image: data.user.image,
              role: (data.user as any).role || 'user'
            },
            expires: new Date(data.session.expiresAt).toISOString(),
          });
          setStatus('authenticated');
        } else {
          setSession(null);
          setStatus('unauthenticated');
        }
      } catch (error) {
        console.error('Auth session error:', error);
        if (mounted) {
          setSession(null);
          setStatus('unauthenticated');
        }
      }
    };

    getSession();

    // Listen for session changes
    const unsubscribe = authClient.onSessionChange(() => {
      getSession();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { data: session, status };
}

// Compatibility functions that mimic next-auth/react
export async function signIn(provider?: string, options?: any) {
  try {
    if (provider === 'google' || !provider) {
      await authClient.signIn.social({ provider: 'google' });
    } else {
      // For other providers or credentials
      console.warn('Provider not supported in compatibility layer:', provider);
    }
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

export async function signOut(options?: any) {
  try {
    await authClient.signOut();
    
    // Redirect if requested
    if (options?.callbackUrl) {
      window.location.href = options.callbackUrl;
    } else {
      // Default redirect to home
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

// authClient is already exported above