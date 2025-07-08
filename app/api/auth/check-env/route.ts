import { NextResponse } from 'next/server';

export async function GET() {
  // 환경변수 체크 (민감한 정보는 마스킹)
  const envCheck = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? '✓' : '✗',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✓' : '✗',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '✓' : '✗',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '✓' : '✗',
    DATABASE_URL: process.env.DATABASE_URL ? '✓' : '✗',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓' : '✗',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗',
  };

  return NextResponse.json({
    status: 'Environment variables check',
    env: envCheck,
    nodeEnv: process.env.NODE_ENV,
  });
}