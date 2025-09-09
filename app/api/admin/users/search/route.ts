import { NextRequest, NextResponse } from 'next/server';
import { getD1Client } from '@/lib/d1/client';

export async function GET(request: NextRequest) {
  try {
    // 현재 사용자 확인 (관리자만 접근 가능)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      );
    }

    // 검색 쿼리 파라미터
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim() || '';

    if (query.length < 2) {
      return NextResponse.json({
        users: [],
        query: query
      });
    }

    // 서비스 롤 클라이언트 사용 (모든 사용자 검색을 위해)
    const supabaseAdmin = createServiceRoleClient();

    // 사용자 검색 (이름, 이메일, 전화번호)
    const { data: users, error: searchError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, phone, birth_date, last_login_at, created_at, role')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .eq('status', 'active') // 활성 사용자만
      .neq('role', 'admin') // 관리자는 제외 (자기 자신 포함)
      .order('last_login_at', { ascending: false, nullsFirst: false })
      .limit(20);

    if (searchError) {
      console.error('사용자 검색 오류:', searchError);
      return NextResponse.json(
        { error: '사용자 검색 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: users || [],
      query: query,
      count: users?.length || 0
    });

  } catch (error) {
    console.error('사용자 검색 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}