import { NextRequest, NextResponse } from 'next/server'
import { generateToken } from '@/lib/auth'

interface TokenResponse {
  access_token: string
  expires_in: number
  id_token?: string
  refresh_token?: string
  scope: string
  token_type: string
}

interface GoogleUserInfo {
  sub: string
  email: string
  email_verified?: boolean
  name?: string
  given_name?: string
  family_name?: string
  picture?: string
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  if (error) {
    return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/login?error=Configuration`)
  }

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${appUrl}/login?error=Configuration`)
  }

  try {
    const redirectUri = `${appUrl}/api/auth/google/callback`

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${appUrl}/login?error=AccessDenied`)
    }

    const tokens = (await tokenRes.json()) as TokenResponse

    // Fetch user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userRes.ok) {
      return NextResponse.redirect(`${appUrl}/login?error=AccessDenied`)
    }

    const userInfo = (await userRes.json()) as GoogleUserInfo

    // Create app session token (JWT) with Google user data
    const appToken = generateToken({
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name || userInfo.email.split('@')[0],
      image: userInfo.picture,
      role: 'gp_user',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const response = NextResponse.redirect(new URL('/', appUrl).toString())
    response.cookies.set('auth-token', appToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24h
    })

    return response
  } catch (e) {
    console.error('Google OAuth callback error:', e)
    return NextResponse.redirect(`${appUrl}/login?error=AccessDenied`)
  }
}
