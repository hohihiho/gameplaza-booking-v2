import { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { supabaseAdmin } from '@/app/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

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
            const newUserId = uuidv4(); // UUID 생성
            const { error } = await supabaseAdmin
              .from('users')
              .insert({
                id: newUserId,
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
      try {
        // Google 로그인 콜백인 경우
        if (url.includes('/api/auth/callback/google')) {
          return `${baseUrl}/signup`;
        }
        
        // 상대 경로인 경우
        if (url.startsWith('/')) {
          return `${baseUrl}${url}`;
        }
        
        // 같은 origin인 경우
        const urlObj = new URL(url, baseUrl);
        if (urlObj.origin === baseUrl) {
          return url;
        }
        
        return baseUrl;
      } catch (error) {
        console.error('Redirect error:', error);
        return baseUrl;
      }
    },
    async session({ session, token }) {
      try {
        // 토큰이 없으면 null 세션 반환
        if (!token || !token.email) {
          console.log('No valid token, returning null session');
          return null;
        }

        // 세션 구조 생성
        const newSession = {
          expires: session?.expires || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          user: {
            id: token.sub || '',
            email: token.email || '',
            name: token.name as string || '',
            image: token.picture as string || null,
            isAdmin: false
          }
        };

        return newSession;
      } catch (error) {
        console.error('Session callback error:', error);
        return null;
      }
    },
    async jwt({ token, user, account }) {
      try {
        // 초기 로그인 시 사용자 정보를 토큰에 저장
        if (account && user) {
          console.log('Initial sign in, saving user info to token');
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.picture = user.image;
        }
        
        return token;
      } catch (error) {
        console.error('JWT callback error:', error);
        return token || {};
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