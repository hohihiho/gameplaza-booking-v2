import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notices } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

// GET: 공개 공지사항 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 현재 시간 기준으로 활성화된 공지사항만 조회
    const currentTime = Math.floor(Date.now() / 1000);
    
    let query = db
      .select()
      .from(notices)
      .where(
        and(
          eq(notices.isActive, true),
          // 시작일이 없거나 시작일이 현재 시간 이전
          sql`(${notices.startDate} IS NULL OR ${notices.startDate} <= ${currentTime})`,
          // 종료일이 없거나 종료일이 현재 시간 이후
          sql`(${notices.endDate} IS NULL OR ${notices.endDate} >= ${currentTime})`
        )
      );

    // 카테고리 필터 적용
    if (category && category !== 'all') {
      query = query.where(eq(notices.category, category as any));
    }

    const noticeList = await query
      .orderBy(desc(notices.isPinned), desc(notices.createdAt))
      .limit(limit)
      .offset(offset);

    // 총 개수 조회
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(notices)
      .where(
        and(
          eq(notices.isActive, true),
          sql`(${notices.startDate} IS NULL OR ${notices.startDate} <= ${currentTime})`,
          sql`(${notices.endDate} IS NULL OR ${notices.endDate} >= ${currentTime})`,
          category && category !== 'all' ? eq(notices.category, category as any) : sql`1=1`
        )
      );

    const totalCount = totalCountResult[0]?.count || 0;

    return NextResponse.json({
      success: true,
      data: {
        notices: noticeList,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('공지사항 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '공지사항을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}