import { NextRequest, NextResponse } from 'next/server';

// TODO: D1 데이터베이스로 마이그레이션 필요
// 임시로 비활성화 - Supabase 의존성 제거 중

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: '이 기능은 현재 데이터베이스 마이그레이션 중입니다.',
      message: 'Cloudflare D1으로 전환 작업 진행 중'
    },
    { status: 503 }
  );
}