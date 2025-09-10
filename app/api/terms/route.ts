import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db/server';
import { contentPages } from '@/lib/db/schema';
import { eq, and, desc, inArray, or } from 'drizzle-orm';

// 활성 약관 조회 API (content_pages 테이블 사용)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    // 캐시 헤더 설정 - 30분 캐시, stale-while-revalidate 사용
    const headers = new Headers({
      'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600',
      'Content-Type': 'application/json',
    });
    
    const db = getDB();
    
    // D1 데이터베이스에서 content_pages 조회
    let whereConditions = [eq(contentPages.isPublished, true)];
    
    // 특정 타입이 요청된 경우 필터링
    if (type && ['terms_of_service', 'privacy_policy'].includes(type)) {
      whereConditions.push(eq(contentPages.slug, type));
    } else {
      // type이 지정되지 않은 경우 약관 관련 페이지만 조회
      whereConditions.push(inArray(contentPages.slug, ['terms_of_service', 'privacy_policy']));
    }
    
    const data = await db
      .select()
      .from(contentPages)
      .where(and(...whereConditions))
      .orderBy(desc(contentPages.updatedAt));
    
    // 타입별로 단일 객체 반환 (가장 최신 버전)
    if (type) {
      const terms = data?.[0] || null;
      // D1 content_pages 구조에 맞게 변환
      const formattedTerms = terms ? {
        id: terms.id,
        type: terms.slug,
        title: terms.title,
        content: terms.content,
        is_active: terms.isPublished,
        created_at: terms.createdAt,
        updated_at: terms.updatedAt
      } : null;
      return NextResponse.json({ data: formattedTerms }, { headers });
    }
    
    // 전체 약관 반환 시 타입별로 그룹화
    const termsOfService = data?.find(t => t.slug === 'terms_of_service');
    const privacyPolicy = data?.find(t => t.slug === 'privacy_policy');
    
    const termsMap = {
      terms_of_service: termsOfService ? {
        id: termsOfService.id,
        type: termsOfService.slug,
        title: termsOfService.title,
        content: termsOfService.content,
        is_active: termsOfService.isPublished,
        created_at: termsOfService.createdAt,
        updated_at: termsOfService.updatedAt
      } : null,
      privacy_policy: privacyPolicy ? {
        id: privacyPolicy.id,
        type: privacyPolicy.slug,
        title: privacyPolicy.title,
        content: privacyPolicy.content,
        is_active: privacyPolicy.isPublished,
        created_at: privacyPolicy.createdAt,
        updated_at: privacyPolicy.updatedAt
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