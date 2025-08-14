import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// 활성 약관 조회 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    const supabase = createClient();
    
    let query = supabase
      .from('terms')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    // 특정 타입이 요청된 경우 필터링
    if (type && ['terms_of_service', 'privacy_policy'].includes(type)) {
      query = query.eq('type', type);
    }
    
    const { data, error } = await query;
    
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
      return NextResponse.json({ data: terms });
    }
    
    // 전체 약관 반환 시 타입별로 그룹화
    const termsMap = {
      terms_of_service: data?.find(t => t.type === 'terms_of_service') || null,
      privacy_policy: data?.find(t => t.type === 'privacy_policy') || null
    };
    
    return NextResponse.json({ data: termsMap });
    
  } catch (error) {
    console.error('약관 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}