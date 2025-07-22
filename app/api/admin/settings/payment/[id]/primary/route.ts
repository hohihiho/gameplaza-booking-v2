import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// 기본 계좌로 설정
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

    // 계좌가 활성화되어 있는지 확인
    const { data: account } = await supabaseAdmin.from('payment_accounts')
      .select('is_active')
      .eq('id', id)
      .single();

    if (!account?.is_active) {
      return NextResponse.json({ error: '비활성화된 계좌는 기본 계좌로 설정할 수 없습니다' }, { status: 400 });
    }

    // 모든 계좌의 is_primary를 false로 설정
    await supabaseAdmin.from('payment_accounts')
      .update({ is_primary: false })
      .eq('is_primary', true);

    // 선택한 계좌를 기본 계좌로 설정
    const { data: updatedAccount, error } = await supabaseAdmin.from('payment_accounts')
      .update({ 
        is_primary: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('기본 계좌 설정 오류:', error);
      return NextResponse.json({ error: '기본 계좌 설정 실패' }, { status: 500 });
    }

    return NextResponse.json(updatedAccount);

  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}