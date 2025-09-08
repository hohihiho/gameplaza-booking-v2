import { NextRequest, NextResponse } from 'next/server';
import { db, contentPages } from '@/lib/db/client';
import { eq } from 'drizzle-orm';

// 활성 약관 조회 API (Cloudflare D1 사용)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    // 캐시 헤더 설정 - 30분 캐시, stale-while-revalidate 사용
    const headers = new Headers({
      'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600',
      'Content-Type': 'application/json',
    });
    
    // Drizzle ORM으로 약관 데이터 조회
    let data;
    if (type && ['terms_of_service', 'privacy_policy'].includes(type)) {
      try {
        const result = await db.select().from(contentPages)
          .where(eq(contentPages.slug, type));
        data = result;
      } catch (dbError) {
        console.error('DB 쿼리 오류:', dbError);
        data = [];
      }
    } else {
      // 전체 약관 조회
      try {
        const result = await db.select().from(contentPages)
          .where(eq(contentPages.isPublished, true));
        data = result;
      } catch (dbError) {
        console.error('DB 쿼리 오류:', dbError);
        data = [];
      }
    }
    
    // 타입별로 단일 객체 반환
    if (type) {
      const terms = data?.[0] || null;
      const formattedTerms = terms ? {
        id: terms.id,
        type: terms.slug,
        title: terms.title,
        content: terms.content,
        is_active: terms.isPublished,
        created_at: terms.createdAt?.toISOString(),
        updated_at: terms.updatedAt?.toISOString()
      } : null;
      return NextResponse.json({ data: formattedTerms }, { headers });
    }
    
    // 전체 약관 반환 시 타입별로 그룹화
    const termsOfService = data?.find((t: any) => t.slug === 'terms_of_service');
    const privacyPolicy = data?.find((t: any) => t.slug === 'privacy_policy');
    
    const termsMap = {
      terms_of_service: termsOfService ? {
        id: termsOfService.id,
        type: termsOfService.slug,
        title: termsOfService.title,
        content: termsOfService.content,
        is_active: termsOfService.isPublished,
        created_at: termsOfService.createdAt?.toISOString(),
        updated_at: termsOfService.updatedAt?.toISOString()
      } : null,
      privacy_policy: privacyPolicy ? {
        id: privacyPolicy.id,
        type: privacyPolicy.slug,
        title: privacyPolicy.title,
        content: privacyPolicy.content,
        is_active: privacyPolicy.isPublished,
        created_at: privacyPolicy.createdAt?.toISOString(),
        updated_at: privacyPolicy.updatedAt?.toISOString()
      } : null
    };
    
    return NextResponse.json({ data: termsMap }, { headers });
    
  } catch (error) {
    console.error('약관 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}