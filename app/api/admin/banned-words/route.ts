import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabase';

// 관리자 권한 확인
async function checkAdminAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return { error: '로그인이 필요합니다', status: 401 };
  }

  // 관리자 확인
  const { data: adminData } = await supabaseAdmin
    .from('admins')
    .select('user_id')
    .eq('user_id', session.user.id)
    .single();

  if (!adminData) {
    return { error: '관리자 권한이 필요합니다', status: 403 };
  }

  return { success: true };
}

// 금지어 목록 조회
export async function GET() {
  const authCheck = await checkAdminAuth();
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('banned_words')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Banned words GET error:', error);
    return NextResponse.json(
      { error: '금지어 목록을 불러올 수 없습니다' },
      { status: 500 }
    );
  }
}

// 금지어 추가
export async function POST(request: Request) {
  const authCheck = await checkAdminAuth();
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const body = await request.json();
    const { word, category = 'custom', language = 'ko', severity = 1 } = body;

    if (!word) {
      return NextResponse.json(
        { error: '금지어를 입력해주세요' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    const { data, error } = await supabaseAdmin
      .from('banned_words')
      .insert({
        word: word.trim().toLowerCase(),
        category,
        language,
        severity,
        added_by: session?.user?.id,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: '이미 등록된 금지어입니다' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Banned words POST error:', error);
    return NextResponse.json(
      { error: '금지어 추가에 실패했습니다' },
      { status: 500 }
    );
  }
}

// 금지어 수정/삭제
export async function PATCH(request: Request) {
  const authCheck = await checkAdminAuth();
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const body = await request.json();
    const { id, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID가 필요합니다' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('banned_words')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Banned words PATCH error:', error);
    return NextResponse.json(
      { error: '상태 변경에 실패했습니다' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const authCheck = await checkAdminAuth();
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID가 필요합니다' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('banned_words')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Banned words DELETE error:', error);
    return NextResponse.json(
      { error: '삭제에 실패했습니다' },
      { status: 500 }
    );
  }
}