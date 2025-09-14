import { getDB, supabase } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server';

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
    
//     import { getDB, supabase } from '@/lib/db';
    
    // 호환 레이어: 실제 Supabase 클라이언트 또는 목 객체 모두 지원
    // 1) 체이너블 쿼리 빌더가 있으면 그대로 사용
    const base = (supabase as any).from('content_pages').select('*')
    let data: any[] | null = null
    let error: any = null
    if (base && typeof (base as any).eq === 'function') {
      let qb = (base as any).eq('is_published', true).order('updated_at', { ascending: false })
      if (type && ['terms_of_service', 'privacy_policy'].includes(type)) {
        qb = qb.eq('slug', type)
      } else {
        qb = qb.in('slug', ['terms_of_service', 'privacy_policy'])
      }
      const res = await qb
      data = res?.data ?? null
      error = res?.error ?? null
    } else {
      // 2) 체이닝이 불가능한 목: 전체를 받아 필터링
      const res = await (supabase as any).from('content_pages').select('*')
      data = (res?.data ?? []).filter((row: any) => !!row?.is_published)
      if (type && ['terms_of_service', 'privacy_policy'].includes(type)) {
        data = data.filter((row: any) => row?.slug === type)
      } else {
        data = data.filter((row: any) => ['terms_of_service', 'privacy_policy'].includes(row?.slug))
      }
      // 최신순 정렬 흉내
      data.sort((a: any, b: any) => String(b?.updated_at || '').localeCompare(String(a?.updated_at || '')))
    }
    
    if (error) {
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
