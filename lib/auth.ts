import { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { supabaseAdmin } from '@/app/lib/supabase'

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async signIn({ user, account }) {
      // Google 로그인 성공 후
      if (account?.provider === 'google' && user?.email) {
        try {
          // 사용자가 이미 있는지 확인
          const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', user.email)
            .single();

          if (!existingUser) {
            // 새 사용자 생성 (기본 정보만)
            const { error } = await supabaseAdmin
              .from('users')
              .insert({
                id: user.id, // Google OAuth ID 사용
                email: user.email,
                name: user.name || '',
                nickname: '', // 나중에 입력받음
                phone: '', // 나중에 입력받음
                phone_verified: false,
                role: 'user',
                is_blacklisted: false
              });

            if (error) {
              console.error('Failed to create user:', error);
              // ID 충돌 시 다시 시도하지 않고 그냥 진행
              if (error.code !== '23505') { // unique violation이 아닌 경우에만 실패
                return false;
              }
            }
          }
          
          return true; // 로그인 성공
        } catch (error) {
          console.error('SignIn callback error:', error);
          return false;
        }
      }
      
      return true;
    },
    async redirect({ url, baseUrl }) {
      // 로그인 후 리다이렉트 처리
      if (url.startsWith('/')) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async session({ session, token }) {
      try {
        // 세션이 없으면 빈 세션 생성
        if (!session) {
          console.log('Session is null, creating empty session');
          return {
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            user: undefined
          };
        }

        if (session.user && token?.sub) {
          session.user.id = token.sub;
          
          // 관리자 권한은 데이터베이스에서 확인 (보안 강화)
          // 하드코딩 제거
          session.user.isAdmin = false; // 기본값, API에서 확인
        }
        
        return session;
      } catch (error) {
        console.error('Session callback error:', error);
        return {
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          user: undefined
        };
      }
    },
    async jwt({ token, user, account }) {
      try {
        // 토큰이 없으면 새로 생성
        if (!token) {
          console.log('Token is null, creating new token');
          token = {};
        }

        if (account && user) {
          token.id = user.id;
          token.email = user.email;
        }
        
        return token;
      } catch (error) {
        console.error('JWT callback error:', error);
        return {};
      }
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  secret: process.env.NEXTAUTH_SECRET,
}