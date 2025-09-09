import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notices } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

// GET: 공지사항 상세 조회 및 조회수 증가
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '공지사항 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 현재 시간 기준으로 활성화된 공지사항만 조회
    const currentTime = Math.floor(Date.now() / 1000);
    
    const notice = await db
      .select()
      .from(notices)
      .where(
        and(
          eq(notices.id, id),
          eq(notices.isActive, true),
          // 시작일이 없거나 시작일이 현재 시간 이전
          sql`(${notices.startDate} IS NULL OR ${notices.startDate} <= ${currentTime})`,
          // 종료일이 없거나 종료일이 현재 시간 이후
          sql`(${notices.endDate} IS NULL OR ${notices.endDate} >= ${currentTime})`
        )
      )
      .limit(1);

    if (!notice.length) {
      return NextResponse.json(
        { success: false, error: '공지사항을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 조회수 증가
    await db
      .update(notices)
      .set({ 
        viewCount: sql`${notices.viewCount} + 1`,
        updatedAt: Math.floor(Date.now() / 1000)
      })
      .where(eq(notices.id, id));

    // 업데이트된 공지사항 반환
    const updatedNotice = {
      ...notice[0],
      viewCount: notice[0].viewCount + 1
    };

    return NextResponse.json({
      success: true,
      data: updatedNotice
    });
  } catch (error) {
    console.error('공지사항 상세 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '공지사항을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}