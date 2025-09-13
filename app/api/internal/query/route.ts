import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { sql, params } = await request.json();

    if (!sql) {
      return NextResponse.json(
        { error: 'SQL query is required' },
        { status: 400 }
      );
    }

    // 개발 환경에서는 목업 데이터 반환
    // 실제 프로덕션에서는 D1 바인딩 사용
    console.log('Executing query:', sql, params);

    // 기본 응답
    return NextResponse.json({
      data: [],
      error: null
    });

  } catch (error: any) {
    console.error('Internal query API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST instead.' },
    { status: 405 }
  );
}