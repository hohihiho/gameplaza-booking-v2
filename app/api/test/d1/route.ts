import { NextRequest, NextResponse } from 'next/server';

// D1 연결 테스트 엔드포인트
export async function GET(request: NextRequest) {
  try {
    // Cloudflare Workers 환경에서만 D1 사용 가능
    if (typeof globalThis.DB === 'undefined') {
      return NextResponse.json({ 
        error: 'D1 database not available',
        message: 'D1은 Cloudflare Workers 환경에서만 사용 가능합니다. wrangler dev로 실행하세요.',
        environment: process.env.NODE_ENV 
      }, { status: 503 });
    }

    // 테이블 목록 조회
    const tables = await globalThis.DB.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `).all();

    // users 테이블에 테스트 데이터 삽입
    const testUserId = `test-${Date.now()}`;
    await globalThis.DB.prepare(`
      INSERT INTO users (id, email, name, role) 
      VALUES (?, ?, ?, ?)
    `).bind(testUserId, `test${Date.now()}@example.com`, '테스트 사용자', 'user').run();

    // 삽입된 데이터 조회
    const user = await globalThis.DB.prepare(`
      SELECT * FROM users WHERE id = ?
    `).bind(testUserId).first();

    // 전체 사용자 수 조회
    const count = await globalThis.DB.prepare(`
      SELECT COUNT(*) as count FROM users
    `).first();

    return NextResponse.json({
      success: true,
      message: 'D1 데이터베이스 연결 성공',
      data: {
        tables: tables.results,
        testUser: user,
        totalUsers: count?.count || 0
      }
    });

  } catch (error) {
    console.error('D1 테스트 오류:', error);
    return NextResponse.json({ 
      error: 'D1 테스트 실패',
      message: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// D1 테스트 데이터 삭제
export async function DELETE(request: NextRequest) {
  try {
    if (typeof globalThis.DB === 'undefined') {
      return NextResponse.json({ 
        error: 'D1 database not available' 
      }, { status: 503 });
    }

    // 테스트 데이터 삭제
    const result = await globalThis.DB.prepare(`
      DELETE FROM users WHERE email LIKE 'test%@example.com'
    `).run();

    return NextResponse.json({
      success: true,
      message: '테스트 데이터 삭제 완료',
      deletedRows: result.meta.changes
    });

  } catch (error) {
    console.error('D1 삭제 오류:', error);
    return NextResponse.json({ 
      error: 'D1 삭제 실패',
      message: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}