import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

import { createAdminClient } from '@/lib/supabase';

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 관리자 정보 및 계좌 정보 조회
    const supabaseAdmin = createAdminClient();
  const { data: userData } = await supabaseAdmin.from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

  const { data: adminData } = await supabaseAdmin.from('admins')
      .select('is_super_admin, bank_account')
      .eq('user_id', userData.id)
      .single();

    if (!adminData) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 슈퍼관리자의 개인 계좌 반환
    return NextResponse.json({
      bankAccount: adminData.bank_account || {
        bank: '',
        account: '',
        holder: '',
        qrCodeUrl: ''
      },
      isPersonalAccount: true
    });

  } catch (error) {
    console.error('Bank account API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bank, account, holder, qrCodeUrl, isPersonalAccount } = body;

    // 필수 필드 검증
    if (!bank || !account || !holder) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 사용자 정보 조회
    const supabaseAdmin = createAdminClient();
  const { data: userData } = await supabaseAdmin.from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 관리자 권한 확인
    
  const { data: adminData } = await supabaseAdmin.from('admins')
      .select('id')
      .eq('user_id', userData.id)
      .single();

    if (!adminData) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 슈퍼관리자 권한 확인
    const { data: superAdminCheck } = await supabaseAdmin.from('admins')
      .select('is_super_admin')
      .eq('user_id', userData.id)
      .single();

    if (!superAdminCheck?.is_super_admin) {
      return NextResponse.json(
        { error: 'Only super admin can update bank account' },
        { status: 403 }
      );
    }

    // 슈퍼관리자 개인 계좌로 저장
    const { error: updateError } = await supabaseAdmin.from('admins')
      .update({
        bank_account: {
          bank,
          account,
          holder,
          qrCodeUrl
        },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userData.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Bank account update error:', error);
    return NextResponse.json(
      { error: 'Failed to update bank account' },
      { status: 500 }
    );
  }
}