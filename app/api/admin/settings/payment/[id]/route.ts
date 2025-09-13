import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

import { createAdminClient } from '@/lib/db';

// 관리자 권한 확인 함수
async function checkAdminAuth() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return { error: 'Unauthorized', status: 401 };
  }

  const supabaseAdmin = createAdminClient();
  const { data: userData } = await supabaseAdmin.from('users')
    .select('id')
    .eq('email', session.user.email)
    .single();

  if (!userData) {
    return { error: 'User not found', status: 404 };
  }

  const { data: adminData } = await supabaseAdmin.from('admins')
    .select('is_super_admin')
    .eq('user_id', userData.id)
    .single();

  if (!adminData) {
    return { error: 'Admin access required', status: 403 };
  }

  return { supabaseAdmin, userId: userData.id };
}

// 계좌 정보 수정
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await checkAdminAuth();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;
    const body = await request.json();
    const { bank_name, account_number, account_holder, is_primary } = body;

    // 필수 필드 검증
    if (!bank_name || !account_number || !account_holder) {
      return NextResponse.json({ error: '필수 정보를 입력해주세요' }, { status: 400 });
    }

    const { supabaseAdmin } = authResult;

    // 기본 계좌로 설정하는 경우, 기존 기본 계좌 해제
    if (is_primary) {
      await supabaseAdmin.from('payment_accounts')
        .update({ is_primary: false })
        .eq('is_primary', true);
    }

    // 계좌 정보 업데이트
    const { data: updatedAccount, error } = await supabaseAdmin.from('payment_accounts')
      .update({
        bank_name,
        account_number,
        account_holder,
        is_primary: is_primary || false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('계좌 수정 오류:', error);
      return NextResponse.json({ error: '계좌 수정 실패' }, { status: 500 });
    }

    return NextResponse.json(updatedAccount);

  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// 계좌 삭제
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await checkAdminAuth();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;
    const { supabaseAdmin } = authResult;

    // 기본 계좌는 삭제 불가
    const { data: account } = await supabaseAdmin.from('payment_accounts')
      .select('is_primary')
      .eq('id', id)
      .single();

    if (account?.is_primary) {
      return NextResponse.json({ error: '기본 계좌는 삭제할 수 없습니다' }, { status: 400 });
    }

    // 계좌 삭제
    const { error } = await supabaseAdmin.from('payment_accounts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('계좌 삭제 오류:', error);
      return NextResponse.json({ error: '계좌 삭제 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}