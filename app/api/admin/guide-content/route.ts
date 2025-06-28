import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseAdmin } from '@/app/lib/supabase';

// 관리자 이메일 목록
const ADMIN_EMAILS = ['admin@gameplaza.kr', 'ndz5496@gmail.com'];

// GET - 가이드 콘텐츠 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pageSlug = searchParams.get('pageSlug');

    if (!pageSlug) {
      return NextResponse.json({ error: 'Page slug is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('guide_content')
      .select('content')
      .eq('page_slug', pageSlug)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: no rows returned
      console.error('Error fetching guide content:', error);
      return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
    }

    return NextResponse.json({ content: data?.content || null });
  } catch (error) {
    console.error('Error in GET /api/admin/guide-content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - 가이드 콘텐츠 저장
export async function POST(request: NextRequest) {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { pageSlug, content } = body;

    if (!pageSlug || !content) {
      return NextResponse.json({ error: 'Page slug and content are required' }, { status: 400 });
    }

    // upsert로 저장 (없으면 생성, 있으면 업데이트)
    const { data, error } = await supabaseAdmin
      .from('guide_content')
      .upsert({
        page_slug: pageSlug,
        content,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'page_slug'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving guide content:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in POST /api/admin/guide-content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}