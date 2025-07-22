import { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { createAdminClient } from '@/lib/supabase'
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
          const supabaseAdmin = createAdminClient();
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
        // 토큰이 없으면 기본 세션 반환
        if (!token || !token.email) {
          return session;
        }

        // 토큰에서 isAdmin 값 사용 (JWT 콜백에서 이미 확인됨)
        const isAdmin = token.isAdmin || false;
        

        // 세션이 없으면 새로 생성
        if (!session) {
          return {
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            user: {
              id: token.sub || '',
              email: token.email || '',
              name: token.name as string || '',
              image: token.picture as string || null,
              isAdmin: isAdmin
            }
          };
        }

        // 기존 세션에 isAdmin 추가 - 전체 user 객체를 재구성
        const finalSession = {
          expires: session?.expires || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          user: {
            // 기본 필드
            name: (token.name as string) || session?.user?.name || null,
            email: token.email || session?.user?.email || null,
            image: (token.picture as string) || session?.user?.image || null,
            // 커스텀 필드
            id: token.sub || '',
            isAdmin: isAdmin
          }
        };
        
        return finalSession;
      } catch (error) {
        // 에러 시에도 기본 세션 반환
        return session || {
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          user: {}
        };
      }
    },
    async jwt({ token, user, account }) {
      try {
        // 초기 로그인 시 사용자 정보를 토큰에 저장
        if (account && user) {
          token.id = user.id;
          token.email = user.email || undefined;
          token.name = user.name || undefined;
          token.picture = user.image || undefined;
        }
        
        // 항상 관리자 권한 확인 (매 요청마다)
        if (token.email) {
          
          const { data: userData } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', token.email as string)
            .single();
          
          if (userData?.id) {
            const { data: adminData } = await supabaseAdmin
              .from('admins')
              .select('is_super_admin')
              .eq('user_id', userData.id)
              .single();
            
            token.isAdmin = !!adminData?.is_super_admin;
          } else {
            token.isAdmin = false;
          }
        }
        
        return token;
      } catch (error) {
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