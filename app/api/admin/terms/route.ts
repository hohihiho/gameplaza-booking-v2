import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

// 관리자 권한 확인
async function checkAdminAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return { authorized: false, error: '로그인이 필요합니다.' };
  }

  const supabase = createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('email', session.user.email)
    .single();

  if (profile?.role !== 'admin') {
    return { authorized: false, error: '관리자 권한이 필요합니다.' };
  }

  return { authorized: true };
}

// 모든 약관 조회 (관리자용)
export async function GET() {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: 401 }
      );
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('terms')
      .select('*')
      .order('type', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('약관 조회 오류:', error);
      return NextResponse.json(
        { error: '약관을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error('관리자 약관 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 새 약관 생성
export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, title, content, version, effective_date, is_active } = body;

    // 유효성 검사
    if (!type || !title || !content || !version || !effective_date) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    if (!['terms_of_service', 'privacy_policy'].includes(type)) {
      return NextResponse.json(
        { error: '유효하지 않은 약관 타입입니다.' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 새 약관이 활성화되는 경우, 같은 타입의 기존 약관 비활성화
    if (is_active) {
      await supabase
        .from('terms')
        .update({ is_active: false })
        .eq('type', type)
        .eq('is_active', true);
    }

    // 새 약관 생성
    const { data, error } = await supabase
      .from('terms')
      .insert({
        type,
        title,
        content,
        version,
        effective_date,
        is_active: is_active || false
      })
      .select()
      .single();

    if (error) {
      console.error('약관 생성 오류:', error);
      return NextResponse.json(
        { error: '약관 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error('약관 생성 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 약관 수정
export async function PUT(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, title, content, version, effective_date, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 기존 약관 정보 조회
    const { data: existingTerm, error: fetchError } = await supabase
      .from('terms')
      .select('type')
      .eq('id', id)
      .single();

    if (fetchError || !existingTerm) {
      return NextResponse.json(
        { error: '약관을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 활성화되는 경우, 같은 타입의 다른 약관 비활성화
    if (is_active) {
      await supabase
        .from('terms')
        .update({ is_active: false })
        .eq('type', existingTerm.type)
        .eq('is_active', true)
        .neq('id', id);
    }

    // 약관 수정
    const { data, error } = await supabase
      .from('terms')
      .update({
        title,
        content,
        version,
        effective_date,
        is_active: is_active || false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('약관 수정 오류:', error);
      return NextResponse.json(
        { error: '약관 수정 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error('약관 수정 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 약관 삭제
export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 활성화된 약관은 삭제할 수 없음
    const { data: existingTerm } = await supabase
      .from('terms')
      .select('is_active')
      .eq('id', id)
      .single();

    if (existingTerm?.is_active) {
      return NextResponse.json(
        { error: '활성화된 약관은 삭제할 수 없습니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('terms')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('약관 삭제 오류:', error);
      return NextResponse.json(
        { error: '약관 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('약관 삭제 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}