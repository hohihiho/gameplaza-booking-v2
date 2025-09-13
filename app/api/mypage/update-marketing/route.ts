import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // TODO: 실제 DB 업데이트 로직 구현
    return NextResponse.json({
      success: true,
      message: '마케팅 수신 설정이 업데이트되었습니다'
    });
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
