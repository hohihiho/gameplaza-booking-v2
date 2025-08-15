import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { createAdminClient } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// 환경 변수 검증
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('Missing required environment variables: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
  // 빌드 시점에는 환경 변수가 없을 수 있으므로 error 대신 warn 사용
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile"
        }
      },
      allowDangerousEmailAccountLinking: true
    })
  ],
  debug: true, // 디버깅을 위해 임시로 활성화
  callbacks: {
    async signIn({ user, account }) {
      console.log('=== SignIn Callback ===');
      console.log('Provider:', account?.provider);
      console.log('User email:', user?.email);
      
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
    async redirect({ url, baseUrl, token }) {
      // 로그인 후 리다이렉트 처리
      try {
        // Google 로그인 콜백인 경우 - 사용자 상태에 따라 다르게 처리
        if (url.includes('/api/auth/callback/google')) {
          // 토큰에서 관리자 여부 확인
          if (token?.isAdmin) {
            return `${baseUrl}/admin`;
          }
          
          // 기존 사용자인지 확인 (닉네임이 있으면 기존 사용자)
          if (token?.email) {
            const supabaseAdmin = createAdminClient();
            const { data: userData, error } = await supabaseAdmin
              .from('users')
              .select('nickname, role')
              .eq('email', token.email)
              .single();
            
            // 개발 환경에서만 디버그 로그
            if (process.env.NODE_ENV === 'development') {
              console.log('=== Redirect Debug ===');
              console.log('User data:', userData ? 'found' : 'not found');
              console.log('Has nickname:', Boolean(userData?.nickname));
            }
            
            // 닉네임이 있으면 기존 완성된 사용자
            if (userData?.nickname) {
              // 관리자는 관리자 페이지로
              if (userData.role === 'admin') {
                return `${baseUrl}/admin`;
              }
              // 일반 사용자는 메인 페이지로
              return `${baseUrl}/`;
            }
          }
          
          // 새 사용자이거나 정보가 미완성인 경우 회원가입 페이지로
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
        const isAdmin = Boolean(token.isAdmin);

        // 세션 객체가 없는 경우 처리
        if (!session) {
          return {
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            user: {
              id: String(token.sub || ''),
              email: String(token.email || ''),
              name: String(token.name || ''),
              image: token.picture ? String(token.picture) : null,
              nickname: token.nickname ? String(token.nickname) : null,
              isAdmin: isAdmin
            }
          };
        }

        // 기존 세션의 user 객체가 없는 경우 처리
        if (!session.user) {
          session.user = {};
        }

        // 세션 업데이트 - 안전한 문자열 변환
        session.user.id = String(token.sub || '');
        session.user.email = token.email ? String(token.email) : (session.user.email || null);
        session.user.name = token.name ? String(token.name) : (session.user.name || null);
        session.user.image = token.picture ? String(token.picture) : (session.user.image || null);
        // @ts-ignore - NextAuth v5 타입 호환성
        session.user.nickname = token.nickname ? String(token.nickname) : null;
        // @ts-ignore - NextAuth v5 타입 호환성
        session.user.isAdmin = isAdmin;
        
        return session;
      } catch (error) {
        console.error('Session callback error:', error);
        // 에러 시에도 안전한 기본 세션 반환
        return {
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          user: {
            id: '',
            email: null,
            name: null,
            image: null,
            // @ts-ignore - NextAuth v5 타입 호환성
            nickname: null,
            // @ts-ignore - NextAuth v5 타입 호환성
            isAdmin: false
          }
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
          const supabaseAdmin = createAdminClient();
          
          const { data: userData } = await supabaseAdmin
            .from('users')
            .select('id, role, nickname')
            .eq('email', token.email as string)
            .single();
          
          if (userData?.id) {
            // 실제 데이터베이스의 사용자 ID로 업데이트
            token.sub = userData.id;
            token.nickname = userData.nickname || undefined;
            
            const { data: adminData } = await supabaseAdmin
              .from('admins')
              .select('is_super_admin')
              .eq('user_id', userData.id)
              .single();
            
            // admins 테이블에 있으면 관리자로 인정
            token.isAdmin = Boolean(adminData) || userData.role === 'admin';
          } else {
            token.isAdmin = false;
          }
        }
        
        // 안전한 토큰 반환 - 직렬화 가능한 값만 포함
        return {
          ...token,
          isAdmin: Boolean(token.isAdmin)
        };
      } catch (error) {
        console.error('JWT callback error:', error);
        // 에러 시에도 기본 토큰 구조 유지
        return {
          ...token,
          isAdmin: false
        };
      }
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7일로 단축 (보안 강화)
    updateAge: 24 * 60 * 60, // 1일마다 세션 갱신
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7일로 단축
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? process.env.NEXTAUTH_URL?.split('://')[1] : undefined,
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? process.env.NEXTAUTH_URL?.split('://')[1] : undefined,
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  // CSRF 보호 강화
  useSecureCookies: process.env.NODE_ENV === 'production',
})