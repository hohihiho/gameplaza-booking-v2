import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // TODO: Google OAuth 처리
    return NextResponse.json({
      success: true,
      user: {
        id: 'temp-id',
        email: 'user@example.com',
        name: 'User'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
