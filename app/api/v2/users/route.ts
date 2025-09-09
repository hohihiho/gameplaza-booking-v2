import { NextRequest, NextResponse } from 'next/server';
import { D1RepositoryFactory, getD1Database } from '@/lib/repositories/d1';

// GET /api/v2/users - 사용자 목록 조회
export async function GET(request: NextRequest) {
  try {
    const db = getD1Database(request);
    
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const repos = new D1RepositoryFactory(db);
    const searchParams = request.nextUrl.searchParams;
    
    // 검색어가 있으면 검색, 없으면 최근 사용자
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    let users;
    if (query) {
      users = await repos.users.searchUsers(query, limit);
    } else {
      users = await repos.users.findRecentUsers(limit);
    }

    return NextResponse.json({
      success: true,
      data: users,
      count: users.length
    });

  } catch (error) {
    console.error('사용자 조회 오류:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch users',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/v2/users - 새 사용자 생성
export async function POST(request: NextRequest) {
  try {
    const db = getD1Database(request);
    
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { email, name, nickname, phone, marketing_agreed } = body;

    // 필수 필드 검증
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const repos = new D1RepositoryFactory(db);
    
    // 이메일 중복 확인
    const existingUser = await repos.users.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // 사용자 생성
    const user = await repos.users.createUser({
      email,
      name,
      nickname,
      phone,
      marketing_agreed
    });

    return NextResponse.json({
      success: true,
      data: user
    }, { status: 201 });

  } catch (error) {
    console.error('사용자 생성 오류:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}