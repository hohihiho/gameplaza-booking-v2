import { NextRequest, NextResponse } from 'next/server'
import { betterAuth } from "better-auth"
import { db, query } from './db'

// Better Auth 설정
export const auth = betterAuth({
  database: db,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours  
  },
  user: {
    additionalFields: {
      nickname: {
        type: "string",
        required: false,
      },
      phone: {
        type: "string", 
        required: false,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
      },
    },
  },
  advanced: {
    generateId: () => {
      // Generate random hex ID for SQLite compatibility
      return Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    },
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.User

// 현재 사용자 세션 가져오기 (role 정보 포함)
export async function getCurrentUser() {
  try {
    const session = await auth.api.getSession({
      headers: {
        // Request headers will be passed from the API route
      }
    });
    
    if (!session?.user) return null;
    
    // 데이터베이스에서 추가 사용자 정보 가져오기
    const userData = query.getUserById(session.user.id);
    
    if (userData) {
      return {
        ...session.user,
        role: userData.role || 'user'
      };
    }
    
    return session.user;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

// API 라우트용 인증 미들웨어
type AuthHandler = (
  request: NextRequest,
  context: { user: any; [key: string]: any }
) => Promise<NextResponse> | NextResponse;

interface WithAuthOptions {
  requireAdmin?: boolean;
}

export function withAuth(
  handler: AuthHandler,
  options?: WithAuthOptions
): (request: NextRequest, context?: any) => Promise<NextResponse> {
  return async (request: NextRequest, context?: any) => {
    console.log('withAuth: Starting authentication check');
    console.log('withAuth: Options:', options);
    
    try {
      const session = await auth.api.getSession({
        headers: Object.fromEntries(request.headers.entries())
      });
      
      console.log('withAuth: Session:', session ? { user: session.user } : null);
      
      if (!session?.user) {
        console.log('withAuth: No session or user found');
        return NextResponse.json(
          { error: '인증이 필요합니다' },
          { status: 401 }
        );
      }

      // 관리자 권한 확인 (옵션에 따라)
      if (options?.requireAdmin) {
        console.log('withAuth: Checking admin permissions');
        
        const userData = query.getUserById(session.user.id);
        console.log('withAuth: User data:', userData);

        if (!userData || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
          console.log('withAuth: Admin access denied - insufficient role');
          return NextResponse.json(
            { error: '관리자 권한이 필요합니다' },
            { status: 403 }
          );
        }
        
        console.log('withAuth: Admin access granted');
      }
      
      console.log('withAuth: Authentication successful, calling handler');
      // 사용자 정보를 handler에 전달
      return handler(request, { ...context, user: session.user });
    } catch (error) {
      console.error('withAuth: Error during authentication:', error);
      return NextResponse.json(
        { error: '인증 확인 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }
  };
}