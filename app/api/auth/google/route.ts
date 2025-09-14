import { NextResponse } from 'next/server'

// Initiates Google OAuth (Authorization Code Flow)
export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  if (!clientId) {
    return NextResponse.json(
      { error: 'Missing GOOGLE_CLIENT_ID. Check your env config.' },
      { status: 500 }
    )
  }

  const redirectUri = `${appUrl}/api/auth/google/callback`

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', clientId as string)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid email profile')
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')

  return NextResponse.redirect(authUrl.toString())
}
