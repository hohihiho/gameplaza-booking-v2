import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

// 권한 확인 헬퍼 함수
async function checkSuperAdmin(email: string): Promise<boolean> {
  try {
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!userData) return false;

    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('admins')
      .select('is_super_admin')
      .eq('user_id', userData.id)
      .eq('is_super_admin', true)
      .single();

    return !!adminData;
  } catch {
    return false;
  }
}

// 관리자 삭제
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 슈퍼관리자 권한 확인
    const isSuperAdmin = await checkSuperAdmin(session.user.email);
    
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // 관리자 정보 조회
    const supabaseAdmin = createAdminClient();
  const { data$1 } = await supabaseAdmin.from('admins')
      .select('is_super_admin')
      .eq('id', id)
      .single();

    if (fetchError || !adminToDelete) {
      return NextResponse.json({ error: '관리자를 찾을 수 없습니다' }, { status: 404 });
    }

    // 슈퍼관리자는 삭제 불가
    if (adminToDelete.is_super_admin) {
      return NextResponse.json({ error: '슈퍼관리자는 삭제할 수 없습니다' }, { status: 400 });
    }

    // 관리자 삭제
    const supabaseAdmin = createAdminClient();
  const { error$1 } = await supabaseAdmin.from('admins')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete admin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}