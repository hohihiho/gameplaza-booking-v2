import { NextRequest, NextResponse } from 'next/server';
import { ContentPagesRepository } from '@/lib/d1/repositories/content-pages';

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
    
    const contentRepo = new ContentPagesRepository();
    let data;
    
    try {
      // 특정 타입이 요청된 경우 필터링
      if (type && ['terms_of_service', 'privacy_policy'].includes(type)) {
        const page = await contentRepo.findBySlug(type, true);
        data = page ? [page] : [];
      } else {
        // type이 지정되지 않은 경우 약관 관련 페이지만 조회
        data = await contentRepo.findMultiple(['terms_of_service', 'privacy_policy'], true);
      }
    } catch (error) {
      console.error('약관 조회 오류:', error);
      return NextResponse.json(
        { error: '약관을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
    
    // 타입별로 단일 객체 반환 (가장 최신 버전)
    if (type) {
      const terms = data?.[0] || null;
      // content_pages 구조에 맞게 변환
      const formattedTerms = terms ? {
        id: terms.id,
        type: terms.slug,
        title: terms.title,
        content: terms.content,
        is_active: terms.is_published,
        created_at: terms.created_at,
        updated_at: terms.updated_at
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
        is_active: termsOfService.is_published,
        created_at: termsOfService.created_at,
        updated_at: termsOfService.updated_at
      } : null,
      privacy_policy: privacyPolicy ? {
        id: privacyPolicy.id,
        type: privacyPolicy.slug,
        title: privacyPolicy.title,
        content: privacyPolicy.content,
        is_active: privacyPolicy.is_published,
        created_at: privacyPolicy.created_at,
        updated_at: privacyPolicy.updated_at
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