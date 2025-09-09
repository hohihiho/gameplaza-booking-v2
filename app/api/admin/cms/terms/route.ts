import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { contentPages } from '@/lib/db/schema';
import { handleApiError } from '@/lib/api/handler';

// GET /api/admin/cms/terms - 약관 목록 조회
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인 로직을 여기에 추가해야 함
    // Better Auth를 사용하여 세션 확인 및 관리자 권한 확인
    
    const pages = await db
      .select()
      .from(contentPages)
      .orderBy(desc(contentPages.updatedAt));

    return NextResponse.json({
      success: true,
      pages: pages.map(page => ({
        id: page.id,
        slug: page.slug,
        title: page.title,
        contentType: page.contentType,
        version: page.version,
        isPublished: page.isPublished,
        publishedAt: page.publishedAt,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
        // 보안상 실제 content는 목록에서 제외
        content: page.content?.substring(0, 100) + (page.content?.length > 100 ? '...' : ''),
      })),
    });

  } catch (error) {
    console.error('약관 목록 조회 오류:', error);
    return handleApiError(error, '약관 목록을 불러오는 데 실패했습니다.');
  }
}

// POST /api/admin/cms/terms - 새 약관 생성
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인 로직을 여기에 추가해야 함
    
    const body = await request.json();
    const { slug, title, content, contentType = 'markdown', changeLog } = body;

    // 입력 데이터 검증
    if (!slug || !title || !content) {
      return NextResponse.json(
        { error: '슬러그, 제목, 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    // 슬러그 중복 확인
    const existingPage = await db
      .select()
      .from(contentPages)
      .where(eq(contentPages.slug, slug))
      .limit(1);

    if (existingPage.length > 0) {
      return NextResponse.json(
        { error: '이미 존재하는 슬러그입니다.' },
        { status: 409 }
      );
    }

    // 새 페이지 생성
    const [newPage] = await db
      .insert(contentPages)
      .values({
        slug,
        title,
        content,
        contentType,
        version: 1,
        isPublished: false,
        // createdBy: 현재 사용자 ID (Better Auth에서 가져와야 함)
        // updatedBy: 현재 사용자 ID
      })
      .returning();

    // TODO: 버전 히스토리에도 추가해야 함

    return NextResponse.json({
      success: true,
      message: '약관이 성공적으로 생성되었습니다.',
      page: newPage,
    });

  } catch (error) {
    console.error('약관 생성 오류:', error);
    return handleApiError(error, '약관 생성에 실패했습니다.');
  }
}