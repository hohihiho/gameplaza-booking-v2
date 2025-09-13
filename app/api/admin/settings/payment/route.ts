import { NextResponse } from 'next/server';
import { auth } from '@/auth';

import { createAdminClient } from '@/lib/db';

// 계좌 목록 조회
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 관리자 권한 확인
    const supabaseAdmin = createAdminClient();
    const { data: userData } = await supabaseAdmin.from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: adminData } = await supabaseAdmin.from('admins')
      .select('is_super_admin')
      .eq('user_id', userData.id)
      .single();

    if (!adminData) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 계좌 목록 조회
    const { data: accounts, error } = await supabaseAdmin.from('payment_accounts')
      .select('*')
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('계좌 목록 조회 오류:', error);
      return NextResponse.json({ error: '계좌 목록 조회 실패' }, { status: 500 });
    }

    return NextResponse.json(accounts || []);

  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// 새 계좌 추가
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 관리자 권한 확인
    const supabaseAdmin = createAdminClient();
    const { data: userData } = await supabaseAdmin.from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: adminData } = await supabaseAdmin.from('admins')
      .select('is_super_admin')
      .eq('user_id', userData.id)
      .single();

    if (!adminData) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { bank_name, account_number, account_holder, is_primary } = body;

    // 필수 필드 검증
    if (!bank_name || !account_number || !account_holder) {
      return NextResponse.json({ error: '필수 정보를 입력해주세요' }, { status: 400 });
    }

    // 기본 계좌로 설정하는 경우, 기존 기본 계좌 해제
    if (is_primary) {
      await supabaseAdmin.from('payment_accounts')
        .update({ is_primary: false })
        .eq('is_primary', true);
    }

    // 새 계좌 추가
    const { data: newAccount, error } = await supabaseAdmin.from('payment_accounts')
      .insert({
        bank_name,
        account_number,
        account_holder,
        is_primary: is_primary || false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('계좌 추가 오류:', error);
      return NextResponse.json({ error: '계좌 추가 실패' }, { status: 500 });
    }

    return NextResponse.json(newAccount);

  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}