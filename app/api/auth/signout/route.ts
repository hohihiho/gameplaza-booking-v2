import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const callbackUrl = new URL(req.url).searchParams.get('callbackUrl') || '/'
  const res = NextResponse.redirect(callbackUrl)
  res.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  })
  return res
}

