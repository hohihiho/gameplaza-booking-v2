import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// 계좌 활성화/비활성화 토글
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const { id } = await params;
    const body = await request.json();
    const { is_active } = body;

    // 기본 계좌를 비활성화하려는 경우 차단
    if (!is_active) {
      const { data: account } = await supabaseAdmin.from('payment_accounts')
        .select('is_primary')
        .eq('id', id)
        .single();

      if (account?.is_primary) {
        return NextResponse.json({ error: '기본 계좌는 비활성화할 수 없습니다' }, { status: 400 });
      }
    }

    // 계좌 상태 업데이트
    const { data: updatedAccount, error } = await supabaseAdmin.from('payment_accounts')
      .update({ 
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('계좌 상태 변경 오류:', error);
      return NextResponse.json({ error: '계좌 상태 변경 실패' }, { status: 500 });
    }

    return NextResponse.json(updatedAccount);

  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}