import NextAuth, { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      return true
    },
    async redirect({ url, baseUrl }) {
      // 로그인 후 리다이렉트 처리
      if (url.startsWith('/')) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async session({ session, token }) {
      if (session?.user && token.sub) {
        session.user.id = token.sub
        
        // 관리자 권한 확인
        const adminEmails = ['admin@gameplaza.kr', 'ndz5496@gmail.com'];
        const userEmail = session.user.email || '';
        session.user.isAdmin = adminEmails.includes(userEmail);
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        token.id = user.id
        token.email = user.email
      }
      return token
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

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }