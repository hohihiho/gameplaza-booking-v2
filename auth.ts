import { betterAuth } from "better-auth"
import { d1Adapter } from "better-auth-cloudflare"

// 환경 변수 검증
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('Missing required environment variables: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
}

export const auth = betterAuth({
  appName: "GamePlaza V2",
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: ["http://localhost:3000", "https://gameplaza-v2.vercel.app"],
  
  database: d1Adapter({
    database: process.env.DATABASE_URL || "./dev.db"
  }),
  
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      scope: ["openid", "email", "profile"],
      allowDangerousEmailAccountLinking: true,
      mapProfileToUser(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: profile.email_verified || false
        }
      }
    }
  },
  
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user"
      },
      phone: {
        type: "string", 
        required: false
      },
      profileImage: {
        type: "string",
        required: false
      }
    }
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    }
  },
  
  plugins: [],
  
  callbacks: {
    async signIn({ user, account }) {
      console.log('Better Auth SignIn:', { user: user?.email, provider: account?.providerId });
      return true;
    },
    
    async signUp({ user }) {
      console.log('Better Auth SignUp:', { user: user?.email });
      
      // 새 사용자의 기본 역할 설정
      if (user?.email) {
        // 관리자 이메일이면 admin 역할 부여
        const adminEmails = ['ndz5496@gmail.com']; // 필요시 환경변수로 이동
        if (adminEmails.includes(user.email)) {
          user.role = 'admin';
        }
      }
      
      return true;
    }
  },
  
  pages: {
    signIn: '/login',
    signUp: '/login',
    error: '/login',
  }
});

export const { api, getSession } = auth;