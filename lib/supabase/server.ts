import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()
  const session = await getServerSession(authOptions)

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  // NextAuth JWT를 Supabase에 전달
  if (session?.user?.email) {
    // NextAuth 토큰에서 Supabase 호환 JWT 생성
    const jwt = await import('jsonwebtoken')
    const supabaseJWT = jwt.sign(
      {
        aud: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        sub: session.user.id || session.user.email,
        email: session.user.email,
        role: 'authenticated',
      },
      process.env.NEXTAUTH_SECRET!,
      { algorithm: 'HS256' }
    )
    
    // Supabase 세션 설정
    await supabase.auth.setSession({
      access_token: supabaseJWT,
      refresh_token: 'dummy_refresh_token'
    })
  }

  return supabase
}